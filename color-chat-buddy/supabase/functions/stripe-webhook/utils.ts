
import { corsHeaders, type ErrorResponseDetails } from './types.ts'

export const createErrorResponse = (message: string, statusCode: number, details?: ErrorResponseDetails) => {
  console.error(`Error ${statusCode}: ${message}`, details)
  return new Response(
    JSON.stringify({ 
      error: message,
      ...(details && { details })
    }), 
    { 
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
