package com.example.sandboxspring;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScriptExecutionRequest {
    private String code;
    private Long scriptId;
}
