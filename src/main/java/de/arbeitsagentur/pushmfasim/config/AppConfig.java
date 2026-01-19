package de.arbeitsagentur.pushmfasim.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.view.ThymeleafViewResolver;

@Configuration
public class AppConfig {

    @Bean
    public ThymeleafViewResolver thymeleafViewResolver(
            @Autowired SpringTemplateEngine templateEngine,
            @Value("${app.basepath}") String basePath,
            @Value("${app.clientId}") String clientId,
            @Value("${app.clientSecret}") String clientSecret) {
        ThymeleafViewResolver thymeleafViewResolver = new ThymeleafViewResolver();
        thymeleafViewResolver.setTemplateEngine(templateEngine);
        thymeleafViewResolver.setCharacterEncoding("UTF-8");
        thymeleafViewResolver.addStaticVariable("basepath", basePath);
        thymeleafViewResolver.addStaticVariable("clientId", clientId);
        thymeleafViewResolver.addStaticVariable("clientSecret", clientSecret);
        return thymeleafViewResolver;
    }
}
