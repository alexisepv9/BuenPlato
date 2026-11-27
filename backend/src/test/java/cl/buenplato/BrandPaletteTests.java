/** Verifica persistencia del tema Mezy sin cambiar nombre, logo ni aceptar temas desconocidos. */
package cl.buenplato;

import cl.buenplato.settings.BrandSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class BrandPaletteTests {
    @Autowired BrandSettingsService settings;

    @Test void savesMezyAndRejectsUnknownTheme() throws Exception {
        var original = settings.read();
        var saved = settings.save(original.name(), "mezy", original.revision(), false, null);
        assertThat(settings.read().palette()).isEqualTo("mezy");
        assertThat(saved.name()).isEqualTo(original.name());
        assertThat(saved.hasLogo()).isEqualTo(original.hasLogo());
        assertThat(saved.revision()).isEqualTo(original.revision() + 1);
        assertThatThrownBy(() -> settings.save(saved.name(), "unknown", saved.revision(), false, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
