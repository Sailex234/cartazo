<?php
    require_once '../entity/product.php';
    header("Content-Type: application/json");

    // instance the entity
    $product = new Product();
    
    $data = json_decode(file_get_contents("php://input"));
    
    $product->id = $data->id;
    
    if($product->deleteProduct()){
        echo json_encode("Product deleted.");
    } else{
        echo json_encode("Product could not be deleted");
    }