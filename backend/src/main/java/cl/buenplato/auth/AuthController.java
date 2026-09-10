/**
 * Expone inicio, consulta y cierre de sesión mediante autenticación persistida.
 */
package cl.buenplato.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JdbcTemplate jdbc;

    public AuthController(AuthenticationManager authenticationManager, JdbcTemplate jdbc) {
        this.authenticationManager = authenticationManager;
        this.jdbc = jdbc;
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest credentials, HttpServletRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            credentials.email().trim(),
                            credentials.password()
                    )
            );
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            request.getSession(true).setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    context
            );
            return findUser(authentication.getName());
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
        }
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return findUser(authentication.getName());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private UserResponse findUser(String email) {
        UserResponse user = jdbc.query("""
                        SELECT id, email, display_name, role
                        FROM app_users
                        WHERE LOWER(email) = LOWER(?) AND active = TRUE
                        """,
                result -> result.next()
                        ? new UserResponse(
                                result.getLong("id"),
                                result.getString("email"),
                                result.getString("display_name"),
                                result.getString("role")
                        )
                        : null,
                email
        );
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La sesión ya no es válida.");
        }
        return user;
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record UserResponse(
            long id,
            String email,
            String displayName,
            String role
    ) {}
}
