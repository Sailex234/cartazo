<?php
    class Connection
    {
        // parameters
        private $driver = "mysql";
        private $host = "localhost";
        private $username = "root";
        private $password = '';
        private $dbname = "rest-api-php";
        private $charset = "utf8";

       //construct
       public function connect(){
            try {
                $db = "{$this->driver}:host={$this->host};dbname={$this->dbname};charset={$this->charset}";
                $pdo = new PDO($db, $this->username, $this->password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                return $pdo;
            } catch (PDOException $e) {
                exit("¡Error!: " . $e->getMessage());
            }
        }
    }
