package de.arbeitsagentur.pushmfasim;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
@Slf4j
public class MainApplication {

    private final String appName;
    private final String appVersion;

    public static void main(String[] args) {
        new SpringApplicationBuilder().sources(MainApplication.class).run(args);
    }

    public MainApplication(
            @Value("${spring.application.name}") String appName,
            @Value("${spring.application.version}") String appVersion) {
        this.appName = appName;
        this.appVersion = appVersion;
    }

    /**
     * Log der Version nach dem Start der Application.
     */
    @EventListener(ApplicationReadyEvent.class)
    private void test() {
        log.info("#### Start Application: [{}], Version: [{}] gestartet.", appName, appVersion);
    }
}
