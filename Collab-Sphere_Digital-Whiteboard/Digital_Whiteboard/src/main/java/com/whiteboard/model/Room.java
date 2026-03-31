package com.whiteboard.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Data
public class Room {

    @Id
    private String code;

    @OneToMany
    private List<User> users = new ArrayList<>();
}