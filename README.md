# 🕒 Dashboard Orario Scolastico - Sistema PHP + MySQL + JSON

Questo sistema gestisce l'orario scolastico tramite database MySQL e API PHP.

## 📋 Struttura Tabella

La tabella `orario` contiene:
- `NUMERO` (PRIMARY KEY) - ID univoco della lezione  
- `DURATA` (VARCHAR) - durata in formato 1h00, 2h00, etc.
- `CLASSE` (VARCHAR) - classe (es: 1A, 2B, 3LS)
- `AULA` (VARCHAR) - nome aula
- `GIORNO` (ENUM) - giorno della settimana  
- `O_INIZIO` (VARCHAR) - orario inizio in formato 08h00, 09h30...

## 📡 API Endpoints

### `get_orario.php` - Orario e Giorno Specifici
Ottiene tutte le lezioni di un orario specifico in un determinato giorno.

**Parametri (entrambi richiesti):**
- `orario` (richiesto) - formato 08h00, 09h00...
- `giorno` (richiesto) - giorno della settimana (lunedì, martedì, mercoledì, giovedì, venerdì)

**Esempi:**
```
get_orario.php?orario=08h00&giorno=lunedì
get_orario.php?orario=09h00&giorno=martedì
```

**Risposta JSON:**
```json
{
  "success": true,
  "orario_richiesto": "08h00",
  "giorno_richiesto": "lunedì",
  "count": 1,
  "data": [
    {
      "NUMERO": 1,
      "DURATA": "1h00", 
      "CLASSE": "1B",
      "AULA": "AULA 03",
      "GIORNO": "lunedì",
      "O_INIZIO": "08h00"
    }
  ]
}
```

## 📝 Utilizzo JavaScript

```javascript
// funzione per ottenere il json
function getOrarioGiorno(orario, giorno) {
  return fetch(`get_orario.php?orario=${orario}&giorno=${giorno}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    });
}

// esempio di Utilizzo
getOrarioGiorno('08h00', 'martedì')
  .then(lezioni => {
    lezioni.forEach(lezione => {
      console.log('Materia:', lezione.MAT_NOME);
      console.log('Docente:', lezione.DOC_COGN, lezione.DOC_NOME);
      console.log('Durata:', lezione.DURATA);
      console.log('Classe:', lezione.CLASSE);
      console.log('Aula:', lezione.AULA);
      console.log('Giorno:', lezione.GIORNO);
      console.log('Orario inizio:', lezione.O_INIZIO);
      console.log('---');
    });
    })
    .catch(error => console.error(error));
```

## 🔧 Troubleshooting

### Errore di connessione
1. Verifica credenziali in `config.php` *!!importante*
2. Assicurati che MySQL sia in esecuzione
3. Controlla che il database `orario_scuola` esista

### Nessun risultato
- Verifica che la tabella `orario` abbia dati
- Controlla il formato dell'orario (HH:MM)
- Usa `test.html` per diagnosticare

## ⚠️ Note Importanti

- **Parametri obbligatori**: Entrambi `orario` e `giorno` sono richiesti
- **Formato orario**: Usa il formato 08h00, 09h30, etc. (come nel CSV)
- **Giorni validi**: lunedì, martedì, mercoledì, giovedì, venerdì
- **Validazione**: L'API valida automaticamente il formato dei parametri