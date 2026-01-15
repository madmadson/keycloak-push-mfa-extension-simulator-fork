package de.arbeitsagentur.pushmfasim.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/confirm")
public class ConfirmController {

    private static final Logger logger = LoggerFactory.getLogger(ConfirmController.class);

    @GetMapping
    public String showInfoPage() {
        return "confirm-page";
    }

    @PostMapping(path = "/login")
    @ResponseBody
    public ResponseEntity<String> completeEnrollProcess() {
        logger.info("Starting confirm login process");

        return ResponseEntity.ok("confirm-page");
    }
}
