# Charger les bibliothèques nécessaires
library(plumber)

# Connexion à PostgreSQL
get_db_connection <- function() {
  library(RPostgreSQL)
  conn <- dbConnect(
    PostgreSQL(),
    dbname = Sys.getenv("POSTGRES_DB", "sandbox"),
    user = Sys.getenv("POSTGRES_USER", "postgres"),
    password = Sys.getenv("POSTGRES_PASSWORD", "samar"),
    host = Sys.getenv("POSTGRES_HOST", "postgres"),
    port = Sys.getenv("POSTGRES_PORT", "5432")
  )
  return(conn)
}

# Définir l'API
#* @apiTitle R API for Risk Prediction
#* @apiDescription API pour exécuter des scénarios de prédiction des risques
#* @post /execute
#* @serializer unboxedJSON
function(req) {
  library(RPostgreSQL)
  
  # Récupérer le JSON
  data <- jsonlite::fromJSON(req$postBody)
  code <- data$code
  
  if (is.null(code) || nchar(trimws(code)) == 0) {
    return(list(error = "Erreur: Le code R est vide ou absent", status = "FAILED", output = ""))
  }
  
  # Validation des opérations
  is_safe_operation <- function(query) {
    allowed <- c("SELECT", "UPDATE")
    operation <- toupper(strsplit(query, "\\s+")[[1]][1])
    return(operation %in% allowed)
  }
  
  # Exécuter le code dans un environnement sécurisé
  conn <- get_db_connection()
  output <- tryCatch({
    query_match <- regmatches(code, regexec('dbGetQuery\\(conn, "([^"]+)"\\)', code))
    if (length(query_match[[1]]) > 1) {
      query <- query_match[[1]][2]
      if (!is_safe_operation(query)) {
        stop(paste("Opération interdite :", strsplit(query, "\\s+")[[1]][1]))
      }
      result <- dbGetQuery(conn, query)
      # Retourner une chaîne simple avec les données
      if (nrow(result) > 0) {
        paste(apply(result, 1, toString), collapse = "\n")
      } else {
        "Aucun résultat"
      }
    } else {
      env <- new.env()
      env$conn <- conn
      env$dbGetQuery <- function(conn, query) {
        if (!is_safe_operation(query)) stop("Opération interdite")
        dbGetQuery(conn, query)
      }
      output <- capture.output(eval(parse(text = code), envir = env))
      paste(output, collapse = "\n")
    }
  }, error = function(e) {
    list(error = paste("Erreur:", e$message), status = "FAILED", output = "")
  }, finally = {
    dbDisconnect(conn)
  })
  
  if (is.character(output)) {
    list(output = output, error = "", status = "SUCCESS")
  } else {
    output
  }
}

# Démarrer l'API
if (interactive()) {
  pr() %>% pr_run(host = "0.0.0.0", port = 8086)
}