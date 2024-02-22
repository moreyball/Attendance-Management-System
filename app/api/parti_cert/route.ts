import { NextResponse } from "next/server";
import { mailOptions, transporter } from '@/config/nodemailer'
import puppeteer from 'puppeteer';
import { GenerateCertificateParticipation } from "@/components/certificates/parti_cert";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from 'uuid';

const chromiumExecutablePath = require('@sparticuz/chromium').path;

const url = process.env.NEXT_PUBLIC_WEBSITE_URL;

const generatePdfFromHtml = async (html: string): Promise<Buffer> => {
    const browser = await puppeteer.launch({
        executablePath: chromiumExecutablePath,
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ landscape: true, printBackground: true });
    await browser.close();
    return pdfBuffer;
};

// To handle a GET request to /ap
export async function GET(request: Request) {
    return NextResponse.json({ request }, { status: 200 });
}

export async function POST(request: Request) {
    try {
        const requestData = await request.json();
        const supabase = createClientComponentClient();

        // console.log('Received request data in route:', requestData);

        const atEmail = requestData.attFormsStaffEmail;
        const atEventName = requestData.eventName;
        const atSubEventName = requestData.sub_eventsName;
        const atStaffID = requestData.attFormsStaffID;
        const atStartDate = requestData.eventStartDate;
        const atDateSubmitted = requestData.attDateSubmitted;
        const atStaffName = requestData.attFormsStaffName;
        const atFormsID = requestData.attFormsID;

        const certificateContent = GenerateCertificateParticipation(atStaffName, atSubEventName, atStartDate, atDateSubmitted, atEventName);

        const pdfBuffer = await generatePdfFromHtml(certificateContent);

        let documentPath: string | undefined = "";
        const uniqueName = uuidv4();

        // Use the pdfBuffer directly for uploading to Supabase storage
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('attFormsCertofParticipation')
            .upload(`${atStaffName}_Certificate of Participation_${uniqueName}.pdf`, pdfBuffer, {
                cacheControl: '3600',
                upsert: false,
            });

        documentPath = storageData?.path;

        if (storageError) {
            throw new Error('Error uploading the document to Supabase storage.');
        }

        const { data, error } = await supabase
            .from('attendance_forms')
            .update({ attFormsCertofParticipation: documentPath })
            .eq('attFormsID', atFormsID);

        if (error) {
            throw new Error('Error updating the path for this attendance form.');
        }

        const mailContent = `
            <html>
            <head>
                <style>
                    .email-container {
                        padding: 20px;
                        max-width: 1400px; 
                        margin: 0 auto;
                    }
                    .no-p-m{
                        margin: 0px;
                        padding: 0px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Logo_of_Swinburne_University_of_Technology.svg/1200px-Logo_of_Swinburne_University_of_Technology.svg.png" alt="Image Description" height="150px" width="300px">
                    
                    <h2 class="no-p-m">Dear sir/ ma'am,</h2>
                    <p class="no-p-m">This email serves to inform you that you have successfully participated in an event called ${atEventName}! </p>
                    <br/>
                    <!-- <p class="no-p-m">Please refer to the PDF for your certificate of participation.</p>
                    <br/> -->
                    <p class="no-p-m">Thank you for using our system.</p>
                    <br/>
                    <p class="no-p-m">Regards, <br/> Event Management and Attendance Tracking (EMAT) Developer Team</p>
                    <br/>
                    <p class="no-p-m" style="color: red; text-align: justify;">[NOTICE] <br/>
                    This e-mail and any attachments are confidential and intended only for the use of the addressee. They may contain information that is privileged or protected by copyright. 
                    If you are not the intended recipient, any dissemination, distribution, printing, copying or use is strictly prohibited. 
                    The University does not warrant that this e-mail and any attachments are secure and there is also a risk that it may be corrupted in transmission. 
                    It is your responsibility to check any attachments for viruses or defects before opening them. If you have received this transmission in error, please contact us on 
                    +6082 255000 and delete it immediately from your system. We do not accept liability in connection with computer virus, data corruption, delay, interruption, 
                    unauthorised access or unauthorised amendment. <br/>
                    Process: [Confirmation of Participation]
                    </p>
                </div>
            </body>
        </html>
        `;

        const mailOptionsCopy = { ...mailOptions };
        mailOptionsCopy.to = atEmail;

        if (!mailOptions.to) {
            throw new Error('Recipient email address not specified.');
        }

        const pdfFilename = `${atStaffName} (${atStaffID}) - Certificate of Participation.pdf`;

        await transporter.sendMail({
            ...mailOptionsCopy,
            subject: "Confirmation of Participation",
            text: "Please enable HTML in your email client to view this message.",
            html: mailContent,
            attachments: [
                {
                    filename: pdfFilename,
                    content: pdfBuffer,
                },
            ],
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
}

