/**
 * Endpoint liviano para comprobar disponibilidad y hora de la API.
 */
package cl.buenplato.shared;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "service", "buen-plato-api",
                "timestamp", Instant.now().toString()
        );
    }
}
