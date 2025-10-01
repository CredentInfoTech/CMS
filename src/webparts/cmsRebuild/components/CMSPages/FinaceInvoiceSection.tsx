/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable eqeqeq */

import * as React from "react";
import "./FinaceInvoiceSection.scss";
import { useState, useEffect } from "react";
import { addFileInSharepoint, handleDownload, updateDataToSharePoint, getSharePointData, saveDataToSharePoint, getDocumentLibraryDataWithSelect} from "../services/SharePointService";
export default function FinaceInvoiceSection({
    invoiceRow,
    siteUrl,
    context,
    currentUserEmail

}: {
    invoiceRow: any;
    siteUrl: string;
    context: any;
    currentUserEmail: string


}) {
    const [attachment, setAttachment] = React.useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
   
    console.log(context, "props.context.pageContext.web.absoluteUrl")
    console.log(context.pageContext.web.absoluteUrl, "props.context.pageContext.web.absoluteUrl")

    const CMSInvoiceDocuments = "InvoiceDocument";
    const CMSRequestDetails = "CMSRequestDetails";
    const CMSRequestPaymentDetails = "CMSPaymentHistory";
    const [invoiceID, setInvoiceID] = useState("");
    const [uploadedInvoiceFiles, setUploadedFiles] = useState<any[]>([]);
    // const [isInvoiveNoExist, SetIsInvoiveNoExist] =useState(false);
    const [isInvoiceFileUploaded, setIsFileUploaded] = useState<boolean>(false);
    console.log(uploadedInvoiceFiles, isInvoiceFileUploaded)
    const [InvoiceData, setInvoiceData] = useState({
        invoiceAmount: "",
        invoiceDescription: "",
        invoiceNo: "",
        invoiceDate: "",
        totalTaxAmount: "",
        paymentReceived: "",
        paymentDate: "",
        pendingAmount: "",
        comment: "",
       // addonAmountValue: "",
        paymentDueDate:""
    });
    
    const fetchUploadedFiles = async () => {
      //  alert("fetchUploadedFiles");
        console.log(invoiceRow.InvoiceFileID, "invoiceRow.InvoiceFileID");
    
        // Define the filter query and select fields
        const filterQuery = `$filter=DocID eq '${invoiceRow.InvoiceFileID}'`;
        const selectFields = "Id, FileLeafRef, DocID, ClaimNo, FileRef, EncodedAbsUrl"; // Specify the fields to retrieve
        const libraryName = "InvoiceDocument"; // Replace with your document library name
    
        try {
            // Use the getDocumentLibraryDataWithSelect function
            const response = await getDocumentLibraryDataWithSelect(libraryName, filterQuery, selectFields, siteUrl);
            console.log("Fetched files from library with select:", response);
            setUploadedFiles(response);
        } catch (error) {
            console.error("Error fetching uploaded files from library:", error);
        }
    };

    

    useEffect(() => {
        // Populate fields with data from invoiceRow
        console.log(invoiceRow, "invoiceRow");
       
       
        const generatedUID = Math.random().toString(36).substr(2, 16).toUpperCase();
        setAttachment(null);
        setInvoiceID(generatedUID);
        setInvoiceData((prev) => ({
            ...prev,
            invoiceAmount: invoiceRow?.InvoiceAmount || "",
            invoiceDescription: invoiceRow?.InvoiceDescription || "",
        }));
        if (invoiceRow?.InvoiceStatus === "Generated" || invoiceRow?.InvoiceStatus === "Added") {
            alert("Invoice already generated or added. Please check the status.");
            void fetchUploadedFiles(); // Explicitly ignore the promise
        }
    }, [invoiceRow]);


    // const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    //     const { name, value } = e.target;
    //     console.log("Name:", name, "Value:", value); // Debug

    //     setInvoiceData((prev) => {
    //         const updatedData = {
    //             ...prev,
    //             [name]: value,
    //         };

    //         // Automatically calculate pendingAmount if paymentReceived is updated
    //         if (name === "paymentReceived") {
    //             // const totalTaxAmount = parseFloat(invoiceRow.InvoiceTaxAmount);
    //             const totalTaxAmount = parseFloat(invoiceRow?.PendingAmount);
    //             const paymentReceived = parseFloat(value) || 0;
    //             console.log(totalTaxAmount, "totalTaxAmount")
    //             console.log(paymentReceived, "paymentReceived")
    //             updatedData.pendingAmount = (totalTaxAmount - paymentReceived).toString();
    //         }

    //         return updatedData;
    //     });
    // };

    // const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    //     const { name, value } = e.target;
    //     console.log("Name:", name, "Value:", value); // Debug

    //     setInvoiceData((prev) => ({
    //         ...prev,
    //         [name]: value
    //     }));
    // };


    const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log("Name:", name, "Value:", value); // Debug
    
        setInvoiceData((prev) => {
            const updatedData = {
                ...prev,
                [name]: value,
            };
    
            if (name === "totalTaxAmount" || name === "invoiceAmount") {
                const totalTaxAmount = parseFloat(name === "totalTaxAmount" ? value : updatedData.totalTaxAmount) || 0;
                const invoiceAmount = parseFloat(name === "invoiceAmount" ? value : updatedData.invoiceAmount) || 0;
    
                if (totalTaxAmount <= invoiceAmount) {
                    setValidationError("Total Tax Amount must be greater than Invoice Amount.");
                } else {
                    setValidationError(null); // Clear the error if validation passes
                }
            }
    
         
            return updatedData;
        });
    };

    const handleViewInvoiceFile = (
        e: React.MouseEvent<HTMLButtonElement>,
        encodedUrl: string
    ) => {
        e.preventDefault();
        const viewUrl = `${context.pageContext.web.absoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=${encodedUrl}&file=${encodedUrl}&action=default`;
        window.open(viewUrl, '_blank');
    };

    const handleInvoiceDownload = async (
        e: React.MouseEvent<HTMLButtonElement>,
        encodedUrl: string
    ) => {
        await handleDownload(e, encodedUrl, { context });
    };



    const updateInvoiveFileID = async () => {

        const requestData = {
            InvoiceFileID: invoiceID,

        };

        try {
            const response = await updateDataToSharePoint(CMSRequestDetails, requestData, siteUrl, invoiceRow.itemID);
            console.log("Invoice row updated successfully:", response);


            alert("Invoice row updated successfully!");
        } catch (error) {
            console.error("Error updating invoice row:", error);
            alert("Failed to update invoice row.");
        }
    };

    const handleUpload = async () => {
        console.log(invoiceRow, "invoiceRowinvoiceRow")
        if (!attachment) {
            alert("Please select a file to upload.");
            return;
        }

        try {
            const updateMetadata = {
                DocID: invoiceID,
                ClaimNo: invoiceRow.ClaimNo,

            };

            const filterQuery = `DocID eq '${invoiceID}'`;
            const selectedValues = "Id, FileLeafRef, DocID, ClaimNo, FileRef, EncodedAbsUrl";

            const filedata = await addFileInSharepoint(
                attachment,
                updateMetadata,
                CMSInvoiceDocuments,
                filterQuery,
                selectedValues
            );

            console.log('context', filedata);


            setUploadedFiles(filedata);
            setIsFileUploaded(true);
            setAttachment(null);

            await updateInvoiveFileID();

        } catch (error: any) {
            console.error("Error uploading file:", error);
            alert("Error uploading file.");
        }
    };


    const checkInvoiceNo = async () => {
        const filterQuery = `$filter=InvoicNo eq '${InvoiceData.invoiceNo}'&$orderby=Id desc&$Top=1`;

        try {
            const response = await getSharePointData({ context }, CMSRequestDetails, filterQuery);

            if (response.length > 0) {
                return true;
            } else {
                return false;
            }

        } catch (error) {
            console.error("Error fetching invoice Details:", error);
            return false;
        }
    };

    const handleGenerate = async () => {
        const isInvoiceExist = await checkInvoiceNo();
        console.log(isInvoiceExist, "isInvoiceExist");
        if(!isInvoiceFileUploaded){
            alert("Please Upload File.");
            return;
        }

        if (isInvoiceExist) {
            alert("Invoice number already exists. Please change the invoice number.");
            return;
        }
       
        if(InvoiceData.invoiceAmount < InvoiceData.totalTaxAmount){
            alert("Invoice Tax Amount should be greater than Invoice Amount.");
            return;
        }

        const requestData = {
            InvoiceStatus: "Generated",
            InvoicNo: InvoiceData.invoiceNo,
            InvoiceDate: InvoiceData.invoiceDate,
            InvoiceTaxAmount: InvoiceData.totalTaxAmount,
            PendingAmount: InvoiceData.totalTaxAmount,
            PaymentDate: InvoiceData.paymentDueDate,
        };

        try {
            const response = await updateDataToSharePoint(CMSRequestDetails, requestData, siteUrl, invoiceRow.itemID);
            console.log("Invoice row updated successfully:", response);

            alert("Invoice row updated successfully!");
        } catch (error) {
            console.error("Error updating invoice row:", error);
            alert("Failed to update invoice row.");
        }
    };

    const addPaymentDetails = async () => {
       
        const invoiceData = {
            PaymentAmount: InvoiceData.paymentReceived,
            PaymentDate: InvoiceData.paymentDate,
            PendingAmount: InvoiceData.pendingAmount,
            Comment: InvoiceData.comment,
            CMSRequestItemID: invoiceRow.itemID,
            ClaimNo: invoiceRow.ClaimNo,
            InvoiceTaxAmount: invoiceRow.InvoiceTaxAmount,
            FinancerName: currentUserEmail,
            UID: invoiceRow.DocId,
            CMSRequestID: invoiceRow.RequestID,
            
        };

        try {
            await saveDataToSharePoint(CMSRequestPaymentDetails, invoiceData, siteUrl);
        } catch (error) {
            console.error("Error saving invoice data", error);
            alert("Failed to save invoice data.");
        }


    };

    const updateInvoiceDetails = async () => {

        const requestData = {
              InvoiceStatus: "Added",
            PendingAmount: InvoiceData.pendingAmount,

        };

        try {
            const response = await updateDataToSharePoint(CMSRequestDetails, requestData, siteUrl, invoiceRow.itemID);
            console.log("Invoice row updated successfully:", response);

            alert("Invoice row updated successfully!");
        } catch (error) {
            console.error("Error updating invoice row:", error);
            alert("Failed to update invoice row.");
        }
    };

    const handleSubmit = async () => {

        await addPaymentDetails();
        await updateInvoiceDetails();
    };

    return (
        <div className="mt-4">
            <h5>Editing Invoice: {invoiceRow?.InvoiceDescription}</h5>
            {/* Row 1 */}
            <div className="row mb-3">
                <div className="col-md-6">
                    <label>Invoice Amount</label>
                    <input
                        type="number"
                        className="form-control"
                        name="invoiceAmount"
                        value={InvoiceData.invoiceAmount}
                        disabled
                        onChange={handleTextFieldChange}
                    />
                </div>
                <div className="col-md-6">
                    <label>Invoice Description</label>
                    <textarea
                        className="form-control"
                        name="invoiceDescription"
                        value={InvoiceData.invoiceDescription}
                        disabled
                        onChange={handleTextFieldChange}
                    />
                </div>
                <div className="col-md-6">
                    <label>Total Pending Amount</label>
                    <textarea
                        className="form-control"
                        name="totalPendingAmount"
                        value={invoiceRow?.PendingAmount}
                        disabled
                        onChange={handleTextFieldChange}
                    />
                </div>
            </div>

            {/* Row 2 */}
            <div className="row mb-3">
               

                {/* File Upload Section */}
{invoiceRow?.InvoiceStatus !== "Generated" && invoiceRow?.InvoiceStatus !== "Added" && (
    <div className="row mb-3">
        <div className="col-md-12">
            <h6>Upload Attachment</h6>
        </div>
        <div className="col-6">
            <div className="input-group">
                <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
                />
                <button className="btn btn-primary" onClick={handleUpload}>
                    Upload
                </button>
            </div>
        </div>
    </div>
)}

{/* Uploaded Files Section */}
{(invoiceRow?.InvoiceStatus === "Generated" || invoiceRow?.InvoiceStatus === "Added" || isInvoiceFileUploaded) && uploadedInvoiceFiles.length > 0 && (
    <div className="mt-4">
        <h5>Uploaded Files</h5>
        <table className="table table-bordered">
            <thead>
                <tr>
                    <th>S.No</th>
                    <th>Document Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {uploadedInvoiceFiles.map((file, index) => (
                    <tr key={file.Id}>
                        <td>{index + 1}</td>
                        <td>{file.FileLeafRef}</td>
                        <td>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => handleViewInvoiceFile(e, file.EncodedAbsUrl)}
                            >
                                View
                            </button>
                            <button
                                className="btn btn-sm btn-success"
                                onClick={(e) => handleInvoiceDownload(e, file.EncodedAbsUrl)}
                            >
                                Download
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)}

                {isInvoiceFileUploaded && uploadedInvoiceFiles.length === 0 && (
                    <div className="mt-4">
                        <p>No files uploaded yet. Please upload a file.</p>
                    </div>
                )}
            </div>

            {/* Row 3 */}
            <div className="row mb-3">
                <div className="col-md-12">
                    <h6>Invoice Generate</h6>
                </div>
                <div className="col-md-3">
                    <label>Invoice No</label>
                    <input
                        type="text"
                        className="form-control"
                        name="invoiceNo"
                        // value={InvoiceData.invoiceNo}
                        value={invoiceRow?.InvoiceStatus === "Generated" || invoiceRow?.InvoiceStatus === "Added" ? invoiceRow.InvoiceNo : InvoiceData.invoiceNo}
                        onChange={handleTextFieldChange}
                        disabled={invoiceRow?.InvoiceStatus === "Generated"  || invoiceRow?.InvoiceStatus === "Added"}
                    />
                </div>
                <div className="col-md-3">
                    <label>Invoice Date</label>
                    <input
                        type="date"
                        className="form-control"
                        name="invoiceDate"
                        // value={InvoiceData.invoiceDate}
                        value={invoiceRow?.InvoiceStatus === "Generated" ? invoiceRow.InvoiceDate : InvoiceData.invoiceDate}
                        onChange={handleTextFieldChange}
                        disabled={invoiceRow?.InvoiceStatus === "Generated"  || invoiceRow?.InvoiceStatus === "Added"}
                    />
                </div>
                <div className="col-md-3">
                    <label>Total Tax Amount</label>
                    <input
                        type="number"
                        className="form-control"
                        name="totalTaxAmount"
                        // value={InvoiceData.totalTaxAmount}
                        value={invoiceRow?.InvoiceStatus === "Generated" ? invoiceRow.InvoiceTaxAmount : InvoiceData.totalTaxAmount}

                        onChange={handleTextFieldChange}
                        disabled={invoiceRow?.InvoiceStatus === "Generated"  || invoiceRow?.InvoiceStatus === "Added"}
                    />
                </div>

                <div className="col-md-3">
                    <label>Payment Due Date</label>
                    <input
                        type="date"
                        className="form-control"
                        name="paymentDueDate"
                        // value={InvoiceData.totalTaxAmount}
                        value={invoiceRow?.InvoiceStatus === "Generated" ? invoiceRow.paymentDueDate : InvoiceData.paymentDueDate}

                        onChange={handleTextFieldChange}
                        disabled={invoiceRow?.InvoiceStatus === "Generated"  || invoiceRow?.InvoiceStatus === "Added"}
                    />
                </div>
                {/* <div className="col-md-3 d-flex align-items-end">
                    <button className="btn btn-success w-100" onClick={handleGenerate}>
                        Generate
                    </button>
                </div> */}
                {invoiceRow?.InvoiceStatus !== "Generated" && invoiceRow?.InvoiceStatus !== "Added" && (
                    <div className="col-md-3 d-flex align-items-end">
                        <button className="btn btn-success w-100" onClick={handleGenerate}>
                            Generate
                        </button>
                    </div>
                )}
            </div>

            {/* Row 4 */}
            {(invoiceRow?.InvoiceStatus == "Generated" || invoiceRow?.InvoiceStatus == "Added") && (

                <div className="row mb-3">
                    <div className="col-12">
                        <h6>Payment Received</h6>
                    </div>
                    <>
                        <div className="col-md-3">
                            <label>Payment Received</label>
                            <input
                                type="number"
                                className="form-control"
                                name="paymentReceived"
                                value={InvoiceData.paymentReceived}
                                onChange={handleTextFieldChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label>Payment Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="paymentDate"
                                value={InvoiceData.paymentDate}
                                onChange={handleTextFieldChange}
                            />
                        </div>
                    </>
                    <div className="col-md-3">
                        <label>Pending Amount</label>
                        <input
                            type="number"
                            className="form-control"
                            name="pendingAmount"
                            value={InvoiceData.pendingAmount}
                            onChange={handleTextFieldChange}
                            disabled
                        />
                    </div>
                    <div className="col-md-3">
                        <label>Comment</label>
                        <textarea
                            className="form-control"
                            rows={2}
                            name="comment"
                            value={InvoiceData.comment}
                            onChange={handleTextFieldChange}
                        />
                    </div>
                    
                    {/* <div className="col-md-3">
                        <label>Email Body</label>
                        <textarea
                            className="form-control"
                            rows={2}
                            name="comment"
                            value={InvoiceData.emailBody}
                            onChange={handleTextFieldChange}
                        />
                    </div> */}
                </div>
            )}

            {/* Submit Button */}
            {(invoiceRow?.InvoiceStatus == "Generated" || invoiceRow?.InvoiceStatus == "Added") && (

                <div className="row">
                    <div className="col-md-12 text-end">
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={!!validationError}>
                            Submit
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

