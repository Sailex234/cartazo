<?php
    require_once '../entity/product.php';
    header("Content-Type: application/json");
    
    // instance the entity
    $product = new Product();
    
    $data = json_decode(file_get_contents("php://input"));

    $product->name = $data->name;
    $product->descrip = $data->descrip;
    $product->price = $data->price;
    
    if($product->insertProduct()){
        echo json_encode('Product added successfully.');
    } else{
        echo json_encode('Product could not be added.');
    }