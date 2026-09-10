/**
 * Acceso persistente a las categorías del catálogo.
 */
package cl.buenplato.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderByDisplayOrderAscNameAsc();
}
