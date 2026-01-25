import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone, consent } = body

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Format phone number - remove any non-digit characters and ensure it starts correctly
        let formattedPhone = phone.replace(/\D/g, '')
        
        // If starts with 0, replace with 972 (Israel country code)
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '972' + formattedPhone.substring(1)
        }
        
        // If doesn't start with country code, add 972
        if (!formattedPhone.startsWith('972')) {
            formattedPhone = '972' + formattedPhone
        }

        // Try to save phone to user profile (columns may not exist yet)
        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    phone: formattedPhone,
                    workshop_consent: consent 
                })
                .eq('id', user.id)

            if (updateError) {
                console.error('Error updating user phone:', updateError)
                // Continue anyway - we still want to send the message
            }
        } catch (dbError) {
            console.error('Database update failed (columns may not exist):', dbError)
            // Continue anyway - we still want to send the message
        }

        // If user consented, send webhook to Google Apps Script
        if (consent) {
            try {
                const webhookUrl = "https://script.google.com/macros/s/AKfycbxBhDaLt2hbCRkqTpnUc9wMuxJ7f2a5ixAAdH20PY2ncyzKzWTZrI6nLSU6F7b0ei6o/exec"
                
                // Get user's name if available
                const { data: userData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', user.id)
                    .single()
                
                const senderName = userData?.name || 'ליד מהמערכת'
                const chatId = `${formattedPhone}@c.us`
                
                const webhookPayload = {
                    typeWebhook: "incomingMessageReceived",
                    senderData: {
                        chatId: chatId,
                        sender: chatId,
                        senderName: senderName
                    },
                    messageData: {
                        typeMessage: "textMessage",
                        textMessageData: {
                            textMessage: "מגנט"
                        }
                    }
                }

                const webhookResponse = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(webhookPayload)
                })

                const webhookResult = await webhookResponse.text()
                console.log('Webhook response:', webhookResult)

                return NextResponse.json({
                    success: true,
                    message: 'Phone saved and webhook sent',
                    webhookSent: true
                })
            } catch (webhookError) {
                console.error('Error sending webhook:', webhookError)
                // Still return success for saving phone, just note webhook failed
                return NextResponse.json({
                    success: true,
                    message: 'Phone saved but webhook failed',
                    webhookSent: false
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Phone saved',
            webhookSent: false
        })

    } catch (error) {
        console.error('Workshop consent error:', error)
        return NextResponse.json({
            error: 'שגיאה בשמירת הנתונים',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
