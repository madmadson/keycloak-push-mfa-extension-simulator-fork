package de.arbeitsagentur.pushmfasim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InfoController {

    @GetMapping(path = "/")
    public String showInfoPage() {
        return "info-page";
    }
}
