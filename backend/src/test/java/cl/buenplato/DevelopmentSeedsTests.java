package cl.buenplato;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.*;

/** Arranque desde cero con migraciones y datos demo sin el campo retirado. */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:seeds-check;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.flyway.locations=classpath:db/migration,classpath:db/seed/dev"
})
class DevelopmentSeedsTests {
    @Autowired JdbcTemplate jdbc;
    @Test void createsDemoRecipes() {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recipes",Integer.class)).isGreaterThan(0);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ingredients",Integer.class)).isGreaterThan(0);
    }
}
