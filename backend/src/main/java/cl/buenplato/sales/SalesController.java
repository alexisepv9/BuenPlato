/**
 * API REST del punto de venta, catálogo buffet e historial editable de pedidos.
 */
package cl.buenplato.sales;

import cl.buenplato.sales.SalesDtos.CreateOrderRequest;
import cl.buenplato.sales.SalesDtos.OrderResponse;
import cl.buenplato.sales.SalesDtos.SalesCatalogResponse;
import cl.buenplato.sales.SalesDtos.OrderHistoryResponse;
import cl.buenplato.sales.SalesDtos.UpdateOrderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SalesController {
    private final SalesService sales;

    public SalesController(SalesService sales) {
        this.sales = sales;
    }

    @GetMapping("/sales/catalog")
    SalesCatalogResponse catalog() {
        return sales.catalog();
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request, Authentication authentication) {
        return sales.createOrder(request, authentication.getName());
    }

    @GetMapping("/orders")
    java.util.List<OrderHistoryResponse> orderHistory() {
        return sales.orderHistory();
    }

    /** Entrega el pedido persistido para impresión; nunca imprime un borrador de caja. */
    @GetMapping("/orders/{id}")
    OrderHistoryResponse orderDetail(@PathVariable long id) {
        return sales.findHistoryOrder(id);
    }

    @PutMapping("/orders/{id}")
    OrderHistoryResponse updateOrder(@PathVariable long id, @Valid @RequestBody UpdateOrderRequest request) {
        return sales.updateOrder(id, request);
    }

    @PutMapping("/orders/{id}/content")
    OrderResponse replaceOrder(@PathVariable long id, @Valid @RequestBody SalesDtos.ReplaceOrderRequest request,
                               Authentication authentication) {
        return sales.replaceOrder(id, request, authentication.getName());
    }
}
