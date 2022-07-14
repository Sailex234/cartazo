<?php
    require_once '../entity/product.php';
    header("Content-Type: application/json");

    // instance the entity
    $product = new Product();
    
    $data = json_decode(file_get_contents("php://input"));
    
    $product->id = $data->id;

    $product->name = $data->name;
    $product->descrip = $data->descrip;
    $product->price = $data->price;
    
    if($product->updateProduct()){
        echo json_encode("Product updated.");
    } else{
        echo json_encode("Product could not be updated");
    }
