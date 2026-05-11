package com.whiteboard.controller;

import org.springframework.web.bind.annotation.*;

@RestController
public class TestController {

    @GetMapping("/")
    public String test() {
        return "BACKEND WORKING";
    }
}