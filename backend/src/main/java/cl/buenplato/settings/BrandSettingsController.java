package cl.buenplato.settings;

import java.io.IOException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Lectura pública para el login; SecurityConfig restringe toda escritura a ADMIN. */
@RestController
@RequestMapping("/api/branding")
public class BrandSettingsController {
    private final BrandSettingsService service;
    public BrandSettingsController(BrandSettingsService service) { this.service = service; }
    @GetMapping
    public ResponseEntity<BrandSettingsService.Brand> read() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.read());
    }
    @GetMapping("/logo")
    public ResponseEntity<byte[]> logo() {
        byte[] logo = service.logo();
        return logo == null ? ResponseEntity.notFound().build() : ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.IMAGE_PNG).body(logo);
    }
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BrandSettingsService.Brand save(@RequestParam String name, @RequestParam String palette,
        @RequestParam long revision, @RequestParam(defaultValue = "false") boolean removeLogo,
        @RequestParam(required = false) MultipartFile file) throws IOException {
        return service.save(name, palette, revision, removeLogo, file);
    }
}
