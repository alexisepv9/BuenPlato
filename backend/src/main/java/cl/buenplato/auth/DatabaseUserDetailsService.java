/**
 * Traduce los usuarios almacenados en la base de datos al modelo de Spring Security.
 */
package cl.buenplato.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final JdbcTemplate jdbc;

    public DatabaseUserDetailsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserDetails user = jdbc.query("""
                        SELECT email, password_hash, role, active
                        FROM app_users
                        WHERE LOWER(email) = LOWER(?)
                        """,
                result -> result.next()
                        ? User.withUsername(result.getString("email"))
                                .password(result.getString("password_hash"))
                                .roles(result.getString("role"))
                                .disabled(!result.getBoolean("active"))
                                .build()
                        : null,
                email == null ? "" : email.trim()
        );
        if (user == null) {
            throw new UsernameNotFoundException("Usuario o contraseña incorrectos.");
        }
        return user;
    }
}
