<?php
    require_once '../entity/product.php';
    header("Content-Type: application/json");

    // instance the entity
    $product = new Product();

    $product_info = $product->getProducts();
    $product_count = $product_info->rowCount();

    echo json_encode($product_count);
    
    if($product_count > 0){
        $product_array = array();
        $product_array["body"] = array();
        $product_array["product_count"] = $product_count;

        while ($row = $product_info->fetch(PDO::FETCH_ASSOC)){
            extract($row);
            $e = array(
                "id" => $id,
                "name" => $name,
                "descrip" => $descrip,
                "price" => $price,
            );
            array_push($product_array["body"], $e);
        }
        echo json_encode($product_array);
    }else{
        http_response_code(404);
        echo json_encode(
            array("message" => "No records found.")
        );
    }
