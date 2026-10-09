package cl.buenplato;

import cl.buenplato.catalog.ProductPhotoController;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Verifica validación de dimensiones y persistencia sin modificar el inventario real. */
class ProductPhotoTests {
    @TempDir Path folder;
    @Test void validatesAndStoresRealPng() throws Exception {
        var jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(1L))).thenReturn(1);
        var controller = new ProductPhotoController(jdbc, folder.toString());
        var small = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB), "png", small);
        assertThatThrownBy(() -> controller.upload(1, new MockMultipartFile("file", "small.png", "image/png", small.toByteArray())))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Dimensiones");
        assertThatThrownBy(() -> controller.upload(1, new MockMultipartFile("file", "fake.png", "image/png", "not a photo".getBytes())))
                .isInstanceOf(IllegalArgumentException.class);
        var valid = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(1280, 720, BufferedImage.TYPE_INT_RGB), "png", valid);
        assertThat(controller.upload(1, new MockMultipartFile("file", "photo.png", "image/png", valid.toByteArray())).get("width")).isEqualTo(1280);
        assertThat(controller.get(1).getStatusCode().value()).isEqualTo(200);
        assertThat(folder.resolve("products/1.png")).exists();
    }
}
