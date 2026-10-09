/**
 * Configura sesiones, CORS, protección HTTP y codificación segura de contraseñas.
 */
package cl.buenplato.config;

import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, Environment environment) throws Exception {
        // PathRequest.toH2Console() necesita beans que solo existen cuando la consola
        // H2 está habilitada. Docker usa PostgreSQL, por lo que no debe construir
        // ese matcher en los perfiles prod/docker.
        boolean h2ConsoleEnabled = environment.getProperty(
                "spring.h2.console.enabled",
                Boolean.class,
                false
        );

        return http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .cors(cors -> {})
                .authorizeHttpRequests(auth -> {
                    if (h2ConsoleEnabled) {
                        auth.requestMatchers(PathRequest.toH2Console()).permitAll();
                    }
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/branding", "/api/branding/logo").permitAll()
                            .requestMatchers("/api/branding", "/api/branding/**").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                            .requestMatchers(
                                    "/api/auth/login",
                                    "/actuator/health",
                                    "/swagger-ui/**",
                                    "/swagger-ui.html",
                                    "/v3/api-docs/**"
                            ).permitAll()
                            // Administración de bodega, preparaciones y finanzas:
                            // la regla vive en backend para que no pueda eludirse desde el navegador.
                            .requestMatchers("/api/ingredients/**", "/api/recipes/**", "/api/finance/**")
                            .hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/products/*/recipe").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                            .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                            // Caja necesita leer productos y menús y operar ventas.
                            .requestMatchers(HttpMethod.GET, "/api/categories/**", "/api/products/**", "/api/sales/**")
                            .hasAnyRole("ADMIN", "CASHIER")
                            .requestMatchers("/api/sales/**", "/api/orders", "/api/orders/**").hasAnyRole("ADMIN", "CASHIER")
                            .anyRequest().authenticated();
                })
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .requestCache(cache -> cache.disable())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(Environment environment) {
        var configuration = new CorsConfiguration();
        String configuredPatterns = environment.getProperty(
                "app.cors.allowed-origin-patterns",
                "http://localhost:*,http://127.0.0.1:*"
        );
        configuration.setAllowedOriginPatterns(Arrays.stream(configuredPatterns.split(","))
                .map(String::trim)
                .filter(pattern -> !pattern.isBlank())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("X-Request-ID"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
