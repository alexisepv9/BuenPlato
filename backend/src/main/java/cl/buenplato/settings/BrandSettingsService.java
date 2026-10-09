package cl.buenplato.settings;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Set;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Identidad global con actualización atómica y control de ediciones simultáneas. */
@Service
public class BrandSettingsService {
    private final JdbcTemplate jdbc;
    public BrandSettingsService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public record Brand(String name, String palette, boolean hasLogo, long revision) {}

    /** Publica solo identidad visual, nunca cuentas ni parámetros internos. */
    public Brand read() {
        return jdbc.queryForObject("SELECT * FROM business_settings WHERE id=1", (rs, row) ->
            new Brand(rs.getString("business_name"), rs.getString("palette"), rs.getString("logo_png") != null, rs.getLong("revision")));
    }

    public byte[] logo() {
        String encoded = jdbc.queryForObject("SELECT logo_png FROM business_settings WHERE id=1", String.class);
        return encoded == null ? null : Base64.getDecoder().decode(encoded);
    }

    /** Guarda nombre, paleta y logo como una sola operación; un conflicto nunca pisa cambios ajenos. */
    @Transactional
    public Brand save(String name, String palette, long revision, boolean removeLogo, MultipartFile file) throws IOException {
        name = name == null ? "" : name.trim();
        if (name.isEmpty() || name.length() > 80 || name.chars().anyMatch(Character::isISOControl))
            throw new IllegalArgumentException("El nombre debe contener entre 1 y 80 caracteres, sin saltos de línea.");
        if (!Set.of("terracotta", "ocean", "plum", "forest").contains(palette))
            throw new IllegalArgumentException("Selecciona una paleta disponible.");
        if (removeLogo && file != null && !file.isEmpty()) throw new IllegalArgumentException("Elige reemplazar o quitar el logo, no ambas opciones.");
        String logo = file != null && !file.isEmpty() ? encodeLogo(file) : null;
        int changed = jdbc.update("UPDATE business_settings SET business_name=?, palette=?, logo_png=CASE WHEN ? THEN ? ELSE logo_png END, revision=revision+1, updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?",
            name, palette, removeLogo || logo != null, logo, revision);
        if (changed != 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Otro administrador actualizó la configuración. Recarga antes de guardar.");
        return read();
    }

    /** Inspecciona tamaño antes de decodificar y normaliza PNG para no guardar contenido ejecutable. */
    private String encodeLogo(MultipartFile file) throws IOException {
        if (file.getSize() > 2 * 1024 * 1024) throw new IllegalArgumentException("El logo debe pesar como máximo 2 MB.");
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(file.getBytes()))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("Selecciona un logo JPG o PNG válido.");
            var reader = readers.next();
            try {
                reader.setInput(input);
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("PNG") && !format.equalsIgnoreCase("JPEG")) throw new IllegalArgumentException("El logo debe ser JPG o PNG.");
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 64 || height < 64 || width > 2048 || height > 2048) throw new IllegalArgumentException("El logo debe medir entre 64 × 64 y 2048 × 2048 píxeles.");
                var output = new ByteArrayOutputStream();
                ImageIO.write(reader.read(0), "png", output);
                return Base64.getEncoder().encodeToString(output.toByteArray());
            } finally { reader.dispose(); }
        }
    }
}
