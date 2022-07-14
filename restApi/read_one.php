<?php
    require_once '../entity/product.php';
    header("Content-Type: application/json");

    // instance the entity
    $product = new Product();

    $product->id = isset($_GET['id']) ? $_GET['id'] : exit();
  
    $product->getOneProduct();
    
    if($product->name != null){
        $product_array = array(
            "id" =>  $product->id,
            "name" => $product->name,
            "descrip" => $product->descrip,
            "price" => $product->price,
        );
        http_response_code(200);
        echo json_encode($product_array);
    }else{
        http_response_code(404);
        echo json_encode("Product not found.");
    }
