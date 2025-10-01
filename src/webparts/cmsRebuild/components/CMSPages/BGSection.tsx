/* eslint-disable @typescript-eslint/explicit-function-return-type */
/*eslint-disable @typescript-eslint/no-explicit-any */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { sp } from "@pnp/sp/presets/all";
import { ICmsRebuildProps } from "../ICmsRebuildProps";
import { Modal, Button } from "react-bootstrap";
import { addFileInSharepoint, handleDownload } from "../services/SharePointService";

export default function BGSection(props: ICmsRebuildProps) {
    sp.setup({ spfxContext: { pageContext: props.context.pageContext } });

    const { context } = props;
    const CMSBGDocuments = "CMSBGDocument";

    const [bgEndDate, setBgEndDate] = useState('');
    const [bgFile, setBGFile] = useState<File | null>(null);
    const [bgID, setBgID] = useState("");
    const [uploadedBGFiles, setUploadedFiles] = useState<any[]>([]);
    const [isBGFileUploaded, setIsFileUploaded] = useState<boolean>(false);
    const [showEditBGModal, setShowEditModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [isBGRelease, setIsBGRelease] = useState("No");

    useEffect(() => {
        const generatedUID = Math.random().toString(36).substr(2, 16).toUpperCase();
        setBGFile(null);
        setBgID(generatedUID);
    }, []);

    const UploadBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setBGFile(e.target.files[0]);
        }
    };

    const UploadBgFile = async () => {
        if (!bgFile) {
            alert("Please select a file to upload.");
            return;
        }

        try {
            const updateMetadata = {
                FileID: bgID,
                BGDate: bgEndDate ? new Date(bgEndDate).toISOString().split("T")[0] : null,
                IsBGRelease: "No",
                BGID: bgID
            };

            const filterQuery = `FileID eq '${bgID}'`;
            const selectedValues = "Id, FileLeafRef, FileID, AttachmentType, FileRef, EncodedAbsUrl, IsBGRelease";

            const filedata = await addFileInSharepoint(
                bgFile,
                updateMetadata,
                CMSBGDocuments,
                filterQuery,
                selectedValues
            );
            console.log('context', context);
            console.log('context', filedata);


            setUploadedFiles(filedata); 
            setIsFileUploaded(true);
            setBGFile(null);
        } catch (error: any) {
            console.error("Error uploading file:", error);
            alert("Error uploading file.");
        }
    };

    const handleViewBGFile = (
        e: React.MouseEvent<HTMLButtonElement>,
        encodedUrl: string
    ) => {
        e.preventDefault();
        const viewUrl = `${props.context.pageContext.web.absoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=${encodedUrl}&file=${encodedUrl}&action=default`;
        window.open(viewUrl, '_blank');
    };


    const handleBgDownload = async (
        e: React.MouseEvent<HTMLButtonElement>,
        encodedUrl: string
    ) => {
        await handleDownload(e, encodedUrl, { context: props.context });
    };

    const handleEditClick = (file: any) => {
        setSelectedFile(file);
        setIsBGRelease(file.IsBGRelease || "No");
        setShowEditModal(true);
    };

    const handleCloseBGModal = () => {
        setShowEditModal(false);
        setSelectedFile(null);
    };

    const handleBGReleaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsBGRelease(e.target.value);
    };

    const handleBGRelaseFileUpdate = async () => {
        if (!selectedFile) return;
        try {
            await sp.web.lists.getByTitle(CMSBGDocuments).items.getById(selectedFile.Id).update({
                IsBGRelease: isBGRelease
            });
            alert("BG Release updated successfully!");
            handleCloseBGModal();
        } catch (error: any) {
            console.error("Error updating IsBGRelease:", error);
            alert("Error updating BG release.");
        }
    };

    return (
        <div className="mt-4">
            <div className="row mb-3">
                <div className="col-md-6">
                    <label htmlFor="bgEndDate" className="form-label">BG End Date</label>
                    <input
                        type="date"
                        id="bgEndDate"
                        className="form-control"
                        value={bgEndDate}
                        onChange={(e) => setBgEndDate(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <label htmlFor="fileInput" className="form-label">Upload File</label>
                    <input
                        type="file"
                        className="form-control"
                        id="fileInput"
                        onChange={UploadBgFileChange}
                    />
                </div>
                <div className="mt-3">
                    <button className="btn btn-primary" onClick={UploadBgFile}>Upload</button>
                </div>
            </div>

            {isBGFileUploaded && uploadedBGFiles.length > 0 && (
                <div className="mt-4">
                    <h5>Uploaded Files</h5>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Document Name</th>
                                <th>Attachment Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uploadedBGFiles.map((file, index) => (
                                <tr key={file.Id}>
                                    <td>{index + 1}</td>
                                    <td>{file.FileLeafRef}</td>
                                    <td>{file.AttachmentType || '-'}</td>
                                    <td>
                                        <button className="btn btn-sm btn-primary" onClick={(e) => handleViewBGFile(e, file.EncodedAbsUrl)}>
                                            View
                                        </button>

                                        <button className="btn btn-sm btn-success" onClick={(e) => handleBgDownload(e, file.EncodedAbsUrl)}>
                                            Download
                                        </button>
                                        <button className="btn btn-sm btn-warning ms-2" onClick={() => handleEditClick(file)}>
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isBGFileUploaded && uploadedBGFiles.length === 0 && (
                <div className="mt-4">
                    <p>No files uploaded yet. Please upload a file.</p>
                </div>
            )}

            {/* Edit Modal */}
            <Modal show={showEditBGModal} onHide={handleCloseBGModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit BG Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <label className="form-label">Is BG Release</label>
                        <div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="isBGRelease"
                                    value="No"
                                    checked={isBGRelease === "No"}
                                    onChange={handleBGReleaseChange}
                                />
                                <label className="form-check-label">No</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="isBGRelease"
                                    value="Yes"
                                    checked={isBGRelease === "Yes"}
                                    onChange={handleBGReleaseChange}
                                />
                                <label className="form-check-label">Yes</label>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseBGModal}>Close</Button>
                    <Button variant="primary" onClick={handleBGRelaseFileUpdate}>Update</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
