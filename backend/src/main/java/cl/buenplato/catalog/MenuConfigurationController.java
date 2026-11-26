/** API administrativa de ofertas. SecurityConfig limita todas estas rutas al administrador. */
package cl.buenplato.catalog;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu-configurations")
public class MenuConfigurationController {
    private final MenuConfigurationService service;
    public MenuConfigurationController(MenuConfigurationService service) { this.service=service; }
    @GetMapping public List<MenuConfigurationService.Entry> list() { return service.list(); }
    @PostMapping public Map<String,Long> create(@Valid @RequestBody MenuConfigurationService.Configuration body) { return Map.of("id",service.save(null,body)); }
    @PutMapping("/{id}") public Map<String,Long> update(@PathVariable long id,@Valid @RequestBody MenuConfigurationService.Configuration body) { return Map.of("id",service.save(id,body)); }
    @DeleteMapping("/{id}") public void delete(@PathVariable long id) { service.deactivate(id); }
}
