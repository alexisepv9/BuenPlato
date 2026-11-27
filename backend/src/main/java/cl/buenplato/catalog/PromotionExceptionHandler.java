/** Mensajes seguros de promociones: errores de entrada no son errores 500; SQL queda solo en el log. */
package cl.buenplato.catalog;

import java.util.Map;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@Order(-1)
@RestControllerAdvice(assignableTypes = MenuConfigurationController.class)
public class PromotionExceptionHandler {
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<?> duplicate(DuplicateKeyException error) {
        return ResponseEntity.status(409).body(Map.of("message","Ya existe una oferta o un producto repetido en esta configuración. Revisa el nombre y los productos seleccionados."));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> malformed(HttpMessageNotReadableException error) {
        return ResponseEntity.badRequest().body(Map.of("message","Revisa los números y las fechas: usa cantidades enteras y fechas válidas. Recarga la página si acabas de actualizar el sistema."));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> invalid(MethodArgumentNotValidException error) {
        var fields=error.getBindingResult().getFieldErrors().stream().map(field -> Map.of("field",field.getField(),"message", field.getDefaultMessage()==null ? "Valor inválido" : field.getDefaultMessage())).toList();
        String field=fields.isEmpty() ? "" : fields.getFirst().get("field");
        String hint=field.equals("name") ? "Escribe un nombre de hasta 120 caracteres."
            : field.equals("basePrice") ? "El precio debe estar entre $0 y $10.000.000."
            : field.contains("options") ? "Selecciona productos válidos y revisa sus recargos."
            : field.contains("sections") ? "Agrega productos, selecciona su categoría y usa cantidades entre 1 y 100."
            : "Revisa el tipo de oferta, las fechas y la descripción (máximo 500 caracteres).";
        return ResponseEntity.badRequest().body(Map.of("message",hint,"fieldErrors",fields));
    }
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<?> database(DataAccessException error) {
        String trace=MDC.get("requestId");
        if (trace==null) trace=UUID.randomUUID().toString();
        LoggerFactory.getLogger(PromotionExceptionHandler.class).error("Error de persistencia de promoción, referencia={}",trace,error);
        return ResponseEntity.internalServerError().body(Map.of("message","No se pudo guardar la promoción por un problema de base de datos. Conservamos el formulario. Comunica esta referencia al administrador: " + trace,"requestId",trace));
    }
}
