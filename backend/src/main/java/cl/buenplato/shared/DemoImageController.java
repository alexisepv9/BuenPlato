package cl.buenplato.shared;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Fotos de prueba: solo dos fuentes permitidas, descargadas una vez al storage persistente. */
@RestController
public class DemoImageController {
    private static final Map<String, Integer> SOURCES = Map.of("food", 292, "fruit", 1080);
    private final Path directory;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL).build();

    /** El volumen de Docker conserva estas fotos independientemente del contenedor. */
    public DemoImageController(@Value("${app.storage.path:./storage}") String storage) {
        directory = Path.of(storage).toAbsolutePath().normalize().resolve("demo-images");
    }

    /** Serializa la primera descarga para no duplicar escrituras; no acepta URLs ni rutas del cliente. */
    @GetMapping("/api/images/demo/{name}")
    public synchronized ResponseEntity<Resource> image(@PathVariable String name) {
        Integer id = SOURCES.get(name);
        if (id == null) return ResponseEntity.notFound().build();
        Path target = directory.resolve(name + ".jpg");
        try {
            if (Files.notExists(target)) {
                Files.createDirectories(directory);
                var request = HttpRequest.newBuilder(URI.create("https://picsum.photos/id/" + id + "/640/360"))
                        .timeout(Duration.ofSeconds(12)).GET().build();
                var response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
                byte[] data = response.body();
                if (response.statusCode() != 200 || data.length < 3 || data.length > 2_000_000
                        || (data[0] & 255) != 255 || (data[1] & 255) != 216) {
                    return ResponseEntity.status(503).build();
                }
                Path temporary = Files.createTempFile(directory, "photo-", ".tmp");
                try {
                    Files.write(temporary, data);
                    Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING);
                } finally {
                    Files.deleteIfExists(temporary);
                }
            }
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
                    .cacheControl(CacheControl.noCache().cachePrivate()).body(new FileSystemResource(target));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(503).build();
        } catch (IOException ex) {
            // La ausencia de una foto nunca debe impedir registrar una venta.
            return ResponseEntity.status(503).build();
        }
    }
}
