package cl.buenplato.catalog;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Fotos locales por producto: valida archivos reales y no acepta rutas suministradas por el usuario. */
@RestController
@RequestMapping("/api/products/{id}/photo")
public class ProductPhotoController {
    private final Path root;
    private final JdbcTemplate jdbc;
    public ProductPhotoController(JdbcTemplate jdbc, @Value("${app.storage.path:./storage}") String storage) {
        this.jdbc = jdbc;
        root = Path.of(storage).toAbsolutePath().normalize().resolve("products");
    }

    /** Ambos roles de ventas pueden consultar; subir y quitar requieren ADMIN en SecurityConfig. */
    @GetMapping
    public ResponseEntity<Resource> get(@PathVariable long id) {
        Path file = root.resolve(id + ".png");
        if (id < 1 || !Files.isRegularFile(file)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.IMAGE_PNG)
                .body(new FileSystemResource(file));
    }

    /** Comprueba dimensiones antes de decodificar; reescribe PNG para descartar metadatos y contenido añadido. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@PathVariable long id, @RequestParam("file") MultipartFile file) throws IOException {
        if (jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE id=? AND active=TRUE", Integer.class, id) != 1)
            throw new IllegalArgumentException("El plato no existe o está inactivo.");
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) throw new IllegalArgumentException("La foto debe pesar como máximo 5 MB.");
        try (var input = ImageIO.createImageInputStream(new java.io.ByteArrayInputStream(file.getBytes()))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("Selecciona una imagen JPG o PNG válida.");
            var reader = readers.next();
            try {
                reader.setInput(input);
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("JPEG") && !format.equalsIgnoreCase("PNG")) throw new IllegalArgumentException("Solo se aceptan JPG y PNG.");
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 640 || height < 360 || width > 4096 || height > 4096)
                    throw new IllegalArgumentException("Dimensiones permitidas: mínimo 640 × 360 y máximo 4096 × 4096 píxeles. Ideal: 1280 × 720.");
                var picture = reader.read(0);
                Files.createDirectories(root);
                Path temporary = Files.createTempFile(root, "upload-", ".png");
                try {
                    ImageIO.write(picture, "png", temporary.toFile());
                    Files.move(temporary, root.resolve(id + ".png"), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                } finally { Files.deleteIfExists(temporary); }
                return Map.of("url", "/api/products/" + id + "/photo", "width", width, "height", height);
            } finally { reader.dispose(); }
        }
    }
}
