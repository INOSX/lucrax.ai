import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Parse um arquivo CSV usando Papa Parse
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`Erro ao processar CSV: ${results.errors[0].message}`))
        } else {
          resolve({
            data: results.data,
            columns: results.meta.fields || [],
            rowCount: results.data.length
          })
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler arquivo CSV: ${error.message}`))
      }
    })
  })
}

/**
 * Parse conteúdo CSV a partir de string
 */
export const parseCSVString = (text) => {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`Erro ao processar CSV: ${results.errors[0].message}`))
        } else {
          resolve({
            data: results.data,
            columns: results.meta.fields || [],
            rowCount: results.data.length
          })
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`))
      }
    })
  })
}

/**
 * Parse um arquivo Excel usando XLSX
 */
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length === 0) {
          reject(new Error('Arquivo Excel está vazio'))
          return
        }
        
        // Primeira linha como cabeçalho
        const headers = jsonData[0]
        const rows = jsonData.slice(1)
        
        // Converter para array de objetos
        const dataObjects = rows.map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        
        resolve({
          data: dataObjects,
          columns: headers,
          rowCount: dataObjects.length
        })
      } catch (error) {
        reject(new Error(`Erro ao processar Excel: ${error.message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo Excel'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse conteúdo Excel (xlsx/xls) a partir de ArrayBuffer
 */
export const parseExcelFromArrayBuffer = (arrayBuffer) => {
  try {
    const data = new Uint8Array(arrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    if (jsonData.length === 0) {
      return { data: [], columns: [], rowCount: 0 }
    }
    const headers = jsonData[0]
    const rows = jsonData.slice(1)
    const dataObjects = rows.map(row => {
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })
    return { data: dataObjects, columns: headers, rowCount: dataObjects.length }
  } catch (error) {
    throw new Error(`Erro ao processar Excel: ${error.message}`)
  }
}

export const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Parse um arquivo baseado no tipo
 */
export const parseFile = async (file) => {
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  
  // Detectar tipo de arquivo
  if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    return await parseCSV(file)
  } else if (
    fileType.includes('spreadsheet') || 
    fileType.includes('excel') ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls')
  ) {
    return await parseExcel(file)
  } else {
    throw new Error('Tipo de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)')
  }
}

/**
 * Validar dados parseados
 */
export const validateData = (data) => {
  if (!data || !Array.isArray(data)) {
    throw new Error('Dados inválidos: deve ser um array')
  }
  
  if (data.length === 0) {
    throw new Error('Arquivo está vazio')
  }
  
  // Verificar se todos os objetos têm as mesmas chaves
  const firstRowKeys = Object.keys(data[0])
  const hasConsistentColumns = data.every(row => 
    Object.keys(row).length === firstRowKeys.length &&
    firstRowKeys.every(key => row.hasOwnProperty(key))
  )
  
  if (!hasConsistentColumns) {
    throw new Error('Dados inconsistentes: nem todas as linhas têm as mesmas colunas')
  }
  
  return {
    isValid: true,
    rowCount: data.length,
    columnCount: firstRowKeys.length,
    columns: firstRowKeys
  }
}

/**
 * Limpar e normalizar dados
 */
export const cleanData = (data) => {
  return data.map(row => {
    const cleanedRow = {}
    
    Object.keys(row).forEach(key => {
      let value = row[key]
      
      // Converter para string se não for
      if (value === null || value === undefined) {
        value = ''
      } else {
        value = String(value).trim()
      }
      
      // Tentar converter números
      if (value && !isNaN(value) && value !== '') {
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          value = numValue
        }
      }
      
      // Tentar converter datas
      if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        const dateValue = new Date(value)
        if (!isNaN(dateValue.getTime())) {
          value = dateValue
        }
      }
      
      cleanedRow[key] = value
    })
    
    return cleanedRow
  })
}

/**
 * Detectar tipos de colunas automaticamente
 */
export const detectColumnTypes = (data) => {
  if (!data || data.length === 0) return {}
  
  const firstRow = data[0]
  const columnTypes = {}
  
  Object.keys(firstRow).forEach(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '')
    
    if (values.length === 0) {
      columnTypes[column] = 'string'
      return
    }
    
    // Verificar se todos são números
    const allNumbers = values.every(val => !isNaN(val) && val !== '')
    if (allNumbers) {
      columnTypes[column] = 'number'
      return
    }
    
    // Verificar se todos são datas
    const allDates = values.every(val => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    })
    if (allDates) {
      columnTypes[column] = 'date'
      return
    }
    
    // Verificar se todos são booleanos
    const allBooleans = values.every(val => 
      val === 'true' || val === 'false' || val === true || val === false
    )
    if (allBooleans) {
      columnTypes[column] = 'boolean'
      return
    }
    
    // Padrão: string
    columnTypes[column] = 'string'
  })
  
  return columnTypes
}

/**
 * Gerar estatísticas básicas dos dados
 */
export const generateDataStats = (data) => {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      columnStats: {}
    }
  }
  
  const columns = Object.keys(data[0])
  const columnStats = {}
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '')
    const uniqueValues = [...new Set(values)]
    
    columnStats[column] = {
      totalValues: values.length,
      uniqueValues: uniqueValues.length,
      nullValues: data.length - values.length,
      sampleValues: uniqueValues.slice(0, 5)
    }
    
    // Estatísticas numéricas
    const numericValues = values.filter(val => !isNaN(val) && val !== '')
    if (numericValues.length > 0) {
      const numbers = numericValues.map(Number)
      columnStats[column].numeric = {
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        sum: numbers.reduce((a, b) => a + b, 0)
      }
    }
  })
  
  return {
    totalRows: data.length,
    totalColumns: columns.length,
    columnStats
  }
}
