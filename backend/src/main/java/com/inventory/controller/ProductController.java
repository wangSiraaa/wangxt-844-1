package com.inventory.controller;

import com.inventory.common.Result;
import com.inventory.entity.Product;
import com.inventory.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public Result<List<Product>> getAllProducts() {
        return Result.success(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public Result<Product> getProductById(@PathVariable Long id) {
        return Result.success(productService.getProductById(id));
    }
}
