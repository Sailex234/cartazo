<?php
require_once("../db/database.php");

    class Product extends Connection{
        private $pdo;
        private $table = 'products';

        public $id;
        public $name;
        public $descrip;
        public $price;
        
        //connection to the database
        public function __construct()
        {
            $this->pdo = parent::connect();
        }

        public function getProducts(){
            $sql = "SELECT * FROM ". $this->table;
            $product_info = $this->pdo->prepare($sql);
            $product_info->execute();
            return $product_info;
        }

        public function getOneProduct(){
            $sql = "SELECT * FROM ". $this->table ." WHERE id = ?";
            $product_info = $this->pdo->prepare($sql);

            $product_info->bindValue(1, $this->id);

            $product_info->execute();
            $rows = $product_info->fetch(PDO::FETCH_ASSOC);
            
            $this->name = $rows['name'];
            $this->descrip = $rows['descrip'];
            $this->price = $rows['price'];
        }

        public function insertProduct(){
            $sql = "INSERT INTO ". $this->table ." SET name = :name, descrip = :descrip, price = :price";        
            $product_info = $this->pdo->prepare($sql);

            $product_info->bindValue(":name", $this->name);
            $product_info->bindValue(":descrip", $this->descrip);
            $product_info->bindValue(":price", $this->price);
        
            if($product_info->execute()){
               return true;
            }
            return false;
        }    

        public function updateProduct(){
            $sql = "UPDATE ". $this->table ." SET name = :name, descrip = :descrip, price = :price WHERE id = :id";
        
            $product_info = $this->pdo->prepare($sql);
        
            $product_info->bindValue(":name", $this->name);
            $product_info->bindValue(":descrip", $this->descrip);
            $product_info->bindValue(":price", $this->price);
            $product_info->bindValue(":id", $this->id);
        
            if($product_info->execute()){
               return true;
            }
            return false;
        }

        function deleteProduct(){
            $sql = "DELETE FROM ". $this->table ." WHERE id = ?";
            $product_info = $this->pdo->prepare($sql);
        
            $product_info->bindValue(1, $this->id);
        
            if($product_info->execute()){
                return true;
            }
            return false;
        }
    }
