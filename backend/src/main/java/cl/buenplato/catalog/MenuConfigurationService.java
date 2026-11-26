/** Administración transaccional de colaciones/promociones; ventas reutiliza sus opciones y stock. */
package cl.buenplato.catalog;

import java.time.LocalDate;
import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MenuConfigurationService {
    private final JdbcTemplate jdbc;
    public MenuConfigurationService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record Option(@NotNull Long productId, @Min(0) @Max(10000000) int extraPrice) {}
    public record Section(@NotNull Long categoryId, @NotBlank @Size(max=100) String label,
                          @Min(0) @Max(100) int minimum, @Min(1) @Max(100) int included,
                          @NotEmpty @Size(max=100) List<@NotNull @Valid Option> options) {}
    public record Configuration(@NotBlank @Size(max=120) String name, @Size(max=500) String description,
                                @Pattern(regexp="COLACION|PROMOTION") @NotNull String kind,
                                @Min(0) @Max(10000000) int basePrice, LocalDate availableFrom, LocalDate availableTo,
                                boolean active, @Min(0) int revision,
                                @NotEmpty @Size(max=20) List<@NotNull @Valid Section> sections) {}
    public record Entry(long id, Configuration configuration) {}

    /** Incluye inactivos y futuras ofertas para que el administrador pueda editarlos. */
    @Transactional(readOnly=true)
    public List<Entry> list() {
        return jdbc.query("SELECT * FROM menus ORDER BY id", (rs,n) -> new Entry(rs.getLong("id"),
            new Configuration(rs.getString("name"),rs.getString("description"),rs.getString("menu_kind"),
                rs.getInt("base_price"),rs.getObject("available_from",LocalDate.class),rs.getObject("available_to",LocalDate.class),
                rs.getBoolean("active"),rs.getInt("revision"),sections(rs.getLong("id")))));
    }

    private List<Section> sections(long id) {
        return jdbc.query("SELECT * FROM menu_sections WHERE menu_id=? ORDER BY display_order,id", (rs,n) ->
            new Section(rs.getLong("category_id"),rs.getString("label"),rs.getInt("minimum_selections"),
                rs.getInt("maximum_selections"),jdbc.query("SELECT product_id,extra_price FROM menu_options WHERE menu_section_id=? AND active=TRUE ORDER BY id",
                    (opt,i) -> new Option(opt.getLong(1),opt.getInt(2)),rs.getLong("id"))),id);
    }

    /** Valida pertenencia y vigencia antes de tocar filas; una sección representa una categoría. */
    private void validate(Configuration c) {
        if (c.availableFrom()!=null && c.availableTo()!=null && c.availableFrom().isAfter(c.availableTo()))
            throw new IllegalArgumentException("La fecha final no puede ser anterior a la inicial.");
        Set<Long> categories = new HashSet<>();
        boolean mandatory = false;
        for (Section s : c.sections()) {
            if (!categories.add(s.categoryId()) || s.minimum()>s.included())
                throw new IllegalArgumentException("No repitas categorías y usa un mínimo menor o igual a las unidades incluidas.");
            mandatory |= s.minimum()>0;
            Set<Long> products = new HashSet<>();
            for (Option o : s.options()) {
                if (!products.add(o.productId()) || jdbc.queryForObject("SELECT COUNT(*) FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=? AND p.category_id=? AND p.active=TRUE AND c.active=TRUE",Integer.class,o.productId(),s.categoryId())!=1)
                    throw new IllegalArgumentException("Cada opción debe ser un producto activo de su categoría, sin repetirlo.");
            }
        }
        if (!mandatory) throw new IllegalArgumentException("Agrega al menos una sección obligatoria para evitar vender una oferta vacía.");
    }

    /** Crea o reemplaza la configuración atómicamente; conserva la identidad y los snapshots históricos. */
    @Transactional
    public long save(Long id, Configuration c) {
        validate(c);
        if (jdbc.queryForObject("SELECT COUNT(*) FROM menus WHERE LOWER(name)=LOWER(?) AND (? IS NULL OR id<>?)",
                Integer.class,c.name().trim(),id,id)>0)
            throw new IllegalArgumentException("Ya existe una oferta con ese nombre. Usa otro nombre o edita la existente.");
        if (id==null) {
            id = insert("INSERT INTO menus(name,description,menu_kind,base_price,available_from,available_to,active) VALUES (?,?,?,?,?,?,?)",
                c.name().trim(),c.description(),c.kind(),c.basePrice(),c.availableFrom(),c.availableTo(),c.active());
        } else {
            int updated = jdbc.update("UPDATE menus SET name=?,description=?,menu_kind=?,base_price=?,available_from=?,available_to=?,active=?,revision=revision+1 WHERE id=? AND revision=?",
                c.name().trim(),c.description(),c.kind(),c.basePrice(),c.availableFrom(),c.availableTo(),c.active(),id,c.revision());
            if (updated!=1) throw new IllegalArgumentException("La oferta cambió o ya no existe. Recarga antes de editar.");
            jdbc.update("DELETE FROM menu_sections WHERE menu_id=?",id);
        }
        int index=0;
        for (Section s : c.sections()) {
            long section = insert("INSERT INTO menu_sections(menu_id,category_id,label,minimum_selections,maximum_selections,required,display_order) VALUES (?,?,?,?,?,?,?)",
                id,s.categoryId(),s.label().trim(),s.minimum(),s.included(),s.minimum()>0,index++);
            for (Option o : s.options()) jdbc.update("INSERT INTO menu_options(menu_section_id,product_id,extra_price,active) VALUES (?,?,?,TRUE)",section,o.productId(),o.extraPrice());
        }
        return id;
    }

    /** Elimina de la venta sin borrar órdenes ni referencias históricas. */
    @Transactional
    public void deactivate(long id) {
        if (jdbc.update("UPDATE menus SET active=FALSE,revision=revision+1 WHERE id=?",id)!=1)
            throw new IllegalArgumentException("La oferta no existe.");
    }

    private long insert(String sql,Object... values) {
        var key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement(sql,new String[]{"id"});
            for (int i=0;i<values.length;i++) statement.setObject(i+1,values[i]);
            return statement;
        },key);
        return Objects.requireNonNull(key.getKey()).longValue();
    }
}
