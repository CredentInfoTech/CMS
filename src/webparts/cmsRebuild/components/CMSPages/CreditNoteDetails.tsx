/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/explicit-function-return-type */

import React, { useEffect, useState } from "react";
import { getSharePointData } from "../services/SharePointService";

interface CreditNoteDetailsProps {
  invoiceID: string;
  props: any; // Pass props to access SharePoint context
}

const CreditNoteDetails: React.FC<CreditNoteDetailsProps> = ({ invoiceID, props }) => {
  const [creditNotes, setCreditNotes] = useState<
    Array<{
      fileName: string;
      fileUrl: string;
      description: string;
      createdBy: string;
      createdDate: string;
    }>
  >([]);

  const CreditNote = "CMSCreditNote"; // SharePoint list name

  const fetchCreditNoteDetails = async (invoiceID: string) => {
    const filterQuery = `$filter=InvoiceID eq '${invoiceID}'&$select=FileLeafRef,FileRef,EncodedAbsUrl,Comments,Author/Title,Created&$expand=Author`;
    try {
      const response = await getSharePointData(props, CreditNote, filterQuery);
      if (response && response.length > 0) {
        return response.map((item: any) => ({
          fileName: item.FileLeafRef,
          fileUrl: item.EncodedAbsUrl,
          description: item.Comments || "No description provided",
          createdBy: item.Author?.Title || "Unknown",
          createdDate: item.Created
            ? new Date(item.Created).toLocaleDateString()
            : "Unknown",
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching Credit Note details:", error);
      return [];
    }
  };

  useEffect(() => {
    // Fetch credit note details
    (async () => {
      const details = await fetchCreditNoteDetails(invoiceID);
      setCreditNotes(details);
    })();
  }, [invoiceID]);

  if (creditNotes.length === 0) {
    return <span style={{ color: "#888" }}>No Credit Notes Available</span>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>S No</th>
            <th>Credit Note</th>
            <th>Description</th>
            <th>Created By</th>
            <th>Created Date</th>
          </tr>
        </thead>
        <tbody>
          {creditNotes.map((note, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  {note.fileName}
                </a>
              </td>
              <td>{note.description}</td>
              <td>{note.createdBy}</td>
              <td>{note.createdDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreditNoteDetails;