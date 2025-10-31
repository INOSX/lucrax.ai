import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { parseFile, validateData, cleanData, detectColumnTypes, generateDataStats } from '../../services/dataParser'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { OpenAIService } from '../../services/openaiService'
import Card from '../ui/Card'
import Button from '../ui/Button'

const FileUpload = ({ onDataLoaded, onClose }) => {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [dataStats, setDataStats] = useState(null)
  const [fileName, setFileName] = useState('')

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    setFileName(file.name)

    try {
      // Parse do arquivo
      const result = await parseFile(file)
      
      // Validar dados
      const validation = validateData(result.data)
      if (!validation.isValid) {
        throw new Error('Dados inválidos')
      }

      // Limpar dados
      const cleanedData = cleanData(result.data)
      
      // Detectar tipos de colunas
      const columnTypes = detectColumnTypes(cleanedData)
      
      // Gerar estatísticas
      const stats = generateDataStats(cleanedData)
      
      setParsedData({
        ...result,
        data: cleanedData,
        columnTypes,
        stats
      })
      setOriginalFile(file)
      setDataStats(stats)
      setUploadSuccess(true)
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setUploadError(error.message)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleSaveData = async () => {
    if (!parsedData || !user) return

    setIsUploading(true)
    try {
      // Buscar cliente do usuário
      const clientResult = await ClientService.getClientByUserId(user.id)
      
      if (!clientResult.success) {
        throw new Error('Cliente não encontrado. Por favor, faça logout e login novamente.')
      }

      const client = clientResult.client

      if (!client.vectorstore_id) {
        throw new Error('Vectorstore não configurado para este cliente.')
      }

      // Garantir bucket do usuário no Supabase (chama API com service role)
      const ensureResp = await fetch('/api/supabase/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensureBucket', userId: client.id })
      })
      if (!ensureResp.ok) {
        const err = await ensureResp.json().catch(() => ({}))
        throw new Error(`Falha ao garantir bucket: ${err.error || ensureResp.statusText}`)
      }
      const { bucket } = await ensureResp.json()

      // Salvar metadados no Supabase
      const { supabase } = await import('../../services/supabase')
      
      const { data: savedDataSource, error: dataSourceError } = await supabase
        .from('data_sources_new')
        .insert({
          client_id: client.id,
          filename: fileName,
          file_type: fileName.endsWith('.csv') ? 'csv' : 'xlsx',
          row_count: parsedData.rowCount,
          column_count: parsedData.columns.length,
          column_names: parsedData.columns,
          column_types: Object.values(parsedData.columnTypes),
          file_size: parsedData.fileSize || 0
        })
        .select()
        .single()

      if (dataSourceError) {
        throw new Error(`Erro ao salvar metadados: ${dataSourceError.message}`)
      }

      // 1) Salvar o ARQUIVO ORIGINAL no Supabase Storage (para visualização e vínculo)
      if (originalFile) {
        const ab = await originalFile.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)))
        const resp = await fetch('/api/supabase/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload', bucket, path: originalFile.name, data: base64, contentType: originalFile.type || 'application/octet-stream' })
        })
        if (!resp.ok) {
          const errJ = await resp.json().catch(() => ({}))
          throw new Error(`Erro ao enviar arquivo original: ${errJ.error || resp.statusText}`)
        }
      }

      // 1.2) Salvar também uma CÓPIA CSV no Storage (fonte para gráficos)
      const csvHeaders = parsedData.columns
      const csvRows = [csvHeaders.join(',')]
      parsedData.data.forEach(row => {
        const values = csvHeaders.map(h => {
          const v = row[h]
          if (v === null || v === undefined) return ''
          const s = String(v)
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
        })
        csvRows.push(values.join(','))
      })
      const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const storageCsvPath = `${fileName.replace(/\.[^/.]+$/, '.csv')}`
      {
        const ab = await csvBlob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)))
        const resp = await fetch('/api/supabase/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload', bucket, path: storageCsvPath, data: base64, contentType: 'text/csv' })
        })
        if (!resp.ok) {
          const errJ = await resp.json().catch(() => ({}))
          throw new Error(`Erro ao enviar CSV: ${errJ.error || resp.statusText}`)
        }
      }

      // 2) Fazer upload dos dados (em CSV) para o vectorstore do cliente
      const uploadResult = await OpenAIService.uploadDataToVectorstore(
        client.vectorstore_id,
        parsedData.data,
        fileName
      )

      if (!uploadResult.success) {
        throw new Error(`Erro ao fazer upload para vectorstore: ${uploadResult.error}`)
      }

      // Notificar componente pai com os dados processados
      onDataLoaded({
        id: savedDataSource.id,
        filename: fileName,
        rowCount: parsedData.rowCount,
        columnCount: parsedData.columns.length,
        columns: parsedData.columns,
        columnTypes: parsedData.columnTypes,
        stats: dataStats,
        data: parsedData.data.slice(0, 100) // Apenas preview dos dados
      })
      
      // Fechar modal
      onClose()
      // Notificar que o Storage foi atualizado (Sidebar recarrega a lista)
      window.dispatchEvent(new CustomEvent('storage-updated'))
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      setUploadError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setParsedData(null)
    setDataStats(null)
    setUploadError(null)
    setUploadSuccess(false)
    setFileName('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload de Dados</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {!parsedData ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary-400 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 mx-auto animate-spin" />
                <p className="text-lg font-medium text-gray-900">Processando arquivo...</p>
                <p className="text-sm text-gray-600">{fileName}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Suporte para CSV e Excel (.xlsx, .xls)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tamanho máximo: 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Arquivo processado com sucesso!</span>
            </div>

            {/* File Info */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <File className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">{fileName}</p>
                <p className="text-sm text-gray-600">
                  {dataStats.totalRows} linhas • {dataStats.totalColumns} colunas
                </p>
              </div>
            </div>

            {/* Data Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Preview dos Dados</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {parsedData.columns.slice(0, 10).map((column, index) => (
                          <th
                            key={index}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                        {parsedData.columns.length > 10 && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ...
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.data.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {parsedData.columns.slice(0, 10).map((column, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {(() => {
                                const v = row[column]
                                if (v === null || v === undefined || v === '') return '-'
                                if (v instanceof Date) return v.toLocaleDateString('pt-BR')
                                if (typeof v === 'number') return new Intl.NumberFormat('pt-BR').format(v)
                                return String(v)
                              })()}
                            </td>
                          ))}
                          {parsedData.columns.length > 10 && (
                            <td className="px-4 py-2 text-sm text-gray-500">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.data.length > 5 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                    Mostrando 5 de {parsedData.data.length} linhas
                  </div>
                )}
              </div>
            </div>

            {/* Column Types */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tipos de Colunas Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(parsedData.columnTypes).map(([column, type]) => (
                  <div key={column} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">{column}</p>
                    <p className="text-xs text-gray-600 capitalize">{type}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isUploading}
              >
                Carregar Outro Arquivo
              </Button>
              <Button
                onClick={handleSaveData}
                loading={isUploading}
                disabled={!parsedData}
              >
                Salvar Dados
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{uploadError}</span>
          </div>
        )}
      </Card>
    </div>
  )
}

export default FileUpload
