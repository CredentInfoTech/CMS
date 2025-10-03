/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @rushstack/no-new-null */
/* eslint-disable no-void */

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./RequesterInvoiceSection.module.scss";
import {
  updateDataToSharePoint,
  getSharePointData,
} from "../services/SharePointService"; // Adjust the import path as necessary
import { Modal, Button } from "react-bootstrap"; // Import Bootstrap Modal
import FinaceInvoiceSection from "./FinaceInvoiceSection";
import * as moment from "moment";
import { DatePicker } from "antd";
import {
  getDocumentLibraryDataWithSelect,
  handleDownload,
} from "../services/SharePointService";
import {
  faPlus,
  faTrash,
  faClockRotateLeft,
  // faAngleUp,
  // faAngleDown,
} from "@fortawesome/free-solid-svg-icons";
interface InvoiceRow {
  id: number;
  InvoiceDescription: string;
  RemainingPoAmount: string;
  InvoiceAmount: string;
  InvoiceDueDate: string;
  InvoiceProceedDate: string;
  showProceed: boolean;
  InvoiceStatus: string; // Add InvoiceStatus to the interface
  userInGroup: boolean; // Add userInGroup to the interface
  employeeEmail: string; // Add employeeEmail to the interface
  itemID: number | null;
  InvoiceNo: string;
  InvoiceDate: string;
  InvoiceTaxAmount: string;
  ClaimNo: string;
  DocId: string;
  InvoiceFileID: string;
}

export default function RequesterInvoiceSection({
  userGroups,
  invoiceRows,
  setInvoiceRows,
  handleInvoiceChange,
  addInvoiceRow,
  totalPoAmount,
  errors,
  isEditMode, // Add a prop to indicate edit mode
  approverStatus,
  currentUserEmail, // Add currentUser as a prop
  siteUrl,
  context, // Add context as a prop
  props,
  hideAddInvoiceButton,
  poAmount,
  startDate,
  endDate, // New prop
  disableDeleteInvoiceRow, // <-- New prop
  onProceedButtonCountChange,
  isCollapsed,
  setIsCollapsed, // Add to props:
  selectedRowDetails,
}: {
  userGroups: any;
  invoiceRows: InvoiceRow[];
  setInvoiceRows: React.Dispatch<React.SetStateAction<InvoiceRow[]>>;
  handleInvoiceChange: (
    index: number,
    field: string,
    value: string | number
  ) => void;

  addInvoiceRow: () => void;
  totalPoAmount: number;
  errors: { [key: string]: string };
  isEditMode: boolean; // New prop
  approverStatus: string; // New prop
  currentUserEmail: string; // New prop
  siteUrl: string; // New prop
  context: any;
  props: any;
  hideAddInvoiceButton: boolean;
  poAmount: number;
  startDate: any;
  endDate: any; // New prop
  disableDeleteInvoiceRow?: boolean; // <-- New prop
  onProceedButtonCountChange?: (count: number) => void;

  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>; // Add to props:
  selectedRowDetails?: any; // Add selectedRowDetails prop if needed
}) {
  const InvoiceList = "CMSRequestDetails";
  const InvoiceHistory = "CMSPaymentHistory";
  console.log(siteUrl, "siteUrlinvoice123");
  console.log(props, "propsinvoice123");
  const [showEditModal, setShowEditModal] = React.useState(false); // State to control modal visibility
  const [selectedRow, setSelectedRow] = React.useState<InvoiceRow | null>(null); // State to store selected row data
  const [invoiceHistoryData, setInvoiceHistoryData] = React.useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [invoiceDocuments, setInvoiceDocuments] = React.useState<any[]>([]);
  // const [selectedRows, setSelectedRows] = React.useState<number[]>([]);

  // const allSelected =
  //   invoiceRows.length > 0 && selectedRows.length === invoiceRows.length;

  // const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.checked) {
  //     setSelectedRows(invoiceRows.map((row) => row.id));
  //   } else {
  //     setSelectedRows([]);
  //   }
  // };

  // const handleSelectRow =
  //   (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
  //     if (e.target.checked) {
  //       setSelectedRows((prev) => [...prev, id]);
  //     } else {
  //       setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
  //     }
  //   };
  // ...existing imports...
  // Adjust path if needed
  console.log(userGroups, "userGroupsinvoice12");

  const fetchAllInvoiceDocuments = async (siteUrl: string) => {
    const selectFields = "Id, FileLeafRef, FileRef,EncodedAbsUrl,DocID";
    const libraryName = "InvoiceDocument";
    // const filterQuery = `$top=5000`;
    const filterQuery = `$top=5000`;
    console.log(siteUrl, "siteUrlinvoice");

    try {
      const response = await getDocumentLibraryDataWithSelect(
        libraryName,
        filterQuery,
        selectFields,
        siteUrl
      );
      console.log("All INVOICE items:", response);
      return response;
    } catch (error) {
      console.error("Error fetching invoice Document items:", error);
      return [];
    }
  };
  // ...existing code...

  React.useEffect(() => {
    void (async () => {
      const docs = await fetchAllInvoiceDocuments(props.siteUrl);
      setInvoiceDocuments(docs);
    })();
  }, [props.siteUrl]);

  const pendingStatuses = ["Hold", "Open", "Pending From Approver", "Reminder"];
  // const [proceedClicked, setProceedClicked] = React.useState(false);
  const [proceededRows, setProceededRows] = React.useState<number[]>([]); // store row ids // false by default
  // Delete row
  const deleteInvoiceRow = (id: number) => {
    setInvoiceRows(invoiceRows.filter((row) => row.id !== id));
  };
  // Handle input changes
  const handleTextFieldChange = (
    index: number,
    field: keyof InvoiceRow,
    value: string
  ) => {
    handleInvoiceChange(index, field, value);
  };

  const handleUpdateInvoiceRow = async (
    e: React.MouseEvent<HTMLButtonElement>,
    row: InvoiceRow
  ) => {
    console.log(row.itemID, "row.itemID");
    e.preventDefault(); // Prevent form submission
    if (!row.itemID) {
      console.error("Item ID is missing for the row.");
      return;
    }

    const requestData = {
      ProceedDate: moment(row.InvoiceProceedDate, "DD-MM-YYYY", true).isValid()
        ? moment(row.InvoiceProceedDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"), // fallback to current date

      InvoiceStatus: "Proceeded",
      RunWF: "Yes",
    };

    try {
      const response = await updateDataToSharePoint(
        InvoiceList,
        requestData,
        props.siteUrl,
        row.itemID
      );
      console.log("Invoice row updated successfully:", response);

      // Update the invoiceRows state to reflect the new status
      setInvoiceRows((prevRows) =>
        prevRows.map((r) =>
          r.id === row.id ? { ...r, InvoiceStatus: "Proceeded" } : r
        )
      );
      // setProceedClicked(true);
      setProceededRows((prev) => [...prev, row.id]); // <-- add row id here

      console.log(setInvoiceRows, invoiceRows, "setInvoiceRows");

      alert("Invoice row updated successfully!");
      // window.location.reload(); // Reload the page to reflect changes
    } catch (error) {
      console.error("Error updating invoice row:", error);
      alert("Failed to update invoice row.");
    }
  };
  console.log(invoiceRows, "invoiceRowsabc"); // Log invoiceRows to check its value
  console.log(approverStatus, "approverStatusinvoiceRowsabc"); // Log invoiceRows to check its value
  const handleHistoryClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    row: any
  ) => {
    e.preventDefault();
    console.log(`History clicked for row ${row.itemID}`);
    // const filterQuery = `$filter=CMSRequestItemID eq '${row.itemID}'&$orderby=Id desc`;
    const filterQuery = `$select=*,Author/Title&$expand=Author&$filter=CMSRequestItemID eq '${row.itemID}'&$orderby=Id desc`;

    setHistoryLoading(true);
    setShowHistoryModal(true); // Show modal before fetching (or after if you prefer)

    try {
      const response = await getSharePointData(
        { context },
        InvoiceHistory,
        filterQuery
      );
      console.log("Invoice history fetched successfully:", response);
      setInvoiceHistoryData(response); // Store history data
      console.log(invoiceHistoryData, "invoiceHistoryData");
      // console.log()
    } catch (error) {
      console.error("Error fetching invoice history:", error);
      setInvoiceHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  //   const handleEditClick = (
  //     e: React.MouseEvent<HTMLButtonElement>,
  //     row: InvoiceRow
  //   ) => {
  //     e.preventDefault(); // Prevent form submission
  //     setSelectedRow(row); // Set the selected row data
  //     console.log(row);

  //     setShowEditModal(true); // Show the modal
  //   };

  const handleCloseModal = () => {
    setShowEditModal(false); // Close the modal
    setSelectedRow(null); // Clear the selected row data
  };
  // Safely parse and validate the date:
  interface GetValidDate {
    (dateStr: string): moment.Moment | null;
  }

  const getValidDate: GetValidDate = (
    dateStr: string
  ): moment.Moment | null => {
    console.log(dateStr, "dateStrgetValidDate");
    const parsed = moment(dateStr, "DD-MM-YYYY", true); // strict parsing
    return parsed.isValid() ? parsed : null; // fallback to null (empty)
  };
  console.log(getValidDate);
  const proceedButtonCount = invoiceRows.filter(
    (row) => row.InvoiceStatus === "Started"
  ).length;
  React.useEffect(() => {
    console.log("proceedButtonCount:", proceedButtonCount);
    if (onProceedButtonCountChange) {
      onProceedButtonCountChange(proceedButtonCount);
    }
  }, [proceedButtonCount, onProceedButtonCountChange]);
  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3 section-header">
        <div className="d-flex align-items-center justify-content-between">
          <h5
            className="fw-bold mt-2 me-2 headingColor"
            style={{ cursor: "pointer" }}
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={isCollapsed}
            aria-controls="poDetailsCollapse"
          >
            Invoice Details
          </h5>
          {/* <button
            type="button"
            className="btn btn-link"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={isCollapsed}
            aria-controls="poDetailsCollapse"
            style={{ textDecoration: "none", color: "#ffffff" }}
          >
             {isCollapsed ? (
              <FontAwesomeIcon icon={faAngleUp} />
            ) : (
              <FontAwesomeIcon icon={faAngleDown} />
            )}
          </button> */}
        </div>

        {/* Hide Add Invoice Button if hideAddInvoiceButton is true */}
        {!isEditMode && !hideAddInvoiceButton && (
          <button
            type="button"
            className="btn btn-success"
            onClick={() => {
              if (!poAmount || poAmount === 0) {
                alert("Please enter PO amount before adding invoice rows.");
                return;
              }
              addInvoiceRow();
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Invoice
          </button>
        )}
      </div>

      {/* Responsive Table */}
      <div
        className={`${
          isCollapsed ? "collapse show" : "collapse"
        } section-content`}
        id="poDetailsCollapse"
      >
        {/* <div className="table-responsive">
          <table className="table table-bordered align-middle" style={{ overflow: "scroll !important" }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "200px !important" }}>S.No</th>
                <th style={{ width: "200px !important" }}>Invoice Description</th>
                <th style={{ width: "200px !important" }}>Remaining PO Amount</th>
                <th style={{ width: "200px !important" }}>
                  Invoice Amount<span style={{ color: "red" }}>*</span>
                </th >
                <th style={{ width: "200px !important" }}>
                  Invoice Due Date<span style={{ color: "red" }}>*</span>
                </th>
                {invoiceRows.some((row) => row.showProceed) && (
                  <th style={{ width: "200px !important" }}>Invoice Proceed Date</th>
                )}
                {invoiceRows.some(
                  (row) => row.InvoiceStatus === "Generated"
                ) && <th style={{ width: "200px !important" }}>Invoice Attachment</th>}
                <th style={{ width: "200px !important" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows
                .filter((row) => {
                  // If user belongs to CMSAccountGroup → apply filter
                  if (userGroups.includes("CMSAccountGroup")) {
                    return row.InvoiceStatus !== "Started";
                  }
                  // Otherwise → show all rows
                  return true;
                })
                .map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ width: "200px !important" }}>{index + 1}</td>
                    <td style={{ width: "200px !important" }}>
                      <textarea
                        className={`form-control ${errors[`InvoiceDescription_${index}`]
                          ? "is-invalid"
                          : ""
                          }`}
                        value={row.InvoiceDescription}
                        onChange={(e) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceDescription",
                            e.target.value
                          )
                        }
                        disabled={isEditMode} // Disable in edit mode
                      />
                      {errors[`InvoiceDescription_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDescription_${index}`]}
                        </div>
                      )}
                    </td>
                    <td style={{ width: "200px !important" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={
                          index === 0
                            ? totalPoAmount.toFixed(2)
                            : row.RemainingPoAmount
                        }
                        disabled
                      />
                    </td>
                    <td style={{ width: "200px !important" }}>
                      <input
                        type="number"
                        className={`form-control ${errors[`InvoiceAmount_${index}`] ? "is-invalid" : ""
                          }`}
                        value={row.InvoiceAmount}
                        min={0}
                        step="any"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (Number(value) < 0) return;
                          handleTextFieldChange(index, "InvoiceAmount", value);
                        }}
                        disabled={isEditMode} // Disable in edit mode
                      />
                      {errors[`InvoiceAmount_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceAmount_${index}`]}
                        </div>
                      )}
                    </td>
                    <td style={{ width: "200px !important" }}>
                     
                      <DatePicker
                        type="date"
                        className={`form-control ${errors[`InvoiceDueDate_${index}`] ? "is-invalid" : ""
                          }`}
                        format="DD-MM-YYYY"
                        value={
                          row.InvoiceDueDate
                            ? moment(row.InvoiceDueDate, "DD-MM-YYYY")
                            : null
                        }
                        onChange={(date) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceDueDate",
                            date ? date.format("DD-MM-YYYY") : ""
                          )
                        }
                        disabledDate={(current) =>
                          current && current < moment().startOf("day")
                        }
                        disabled={isEditMode} // Disable in edit mode
                        style={{ width: "150px !important" }}
                      />
                      {errors[`InvoiceDueDate_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDueDate_${index}`]}
                        </div>
                      )}
                    </td>
                    <td
                      style={{ width: "200px !important", display: row.showProceed ? "table-cell" : "none" }}
                    >
                      
                      <DatePicker
                        type="date"
                        format="DD-MM-YYYY"
                        // value={
                        //   row.InvoiceProceedDate === "01/01/1970"
                        //     ? moment()
                        //     : row.InvoiceProceedDate
                        //       ? moment(row.InvoiceProceedDate, "DD-MM-YYYY")
                        //       : null
                        // }
                        value={
                          !row.InvoiceProceedDate ||
                            row.InvoiceProceedDate === "01/01/1970"
                            ? moment()
                            : moment(row.InvoiceProceedDate, "DD-MM-YYYY")
                        }
                        onChange={(date) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceProceedDate",
                            date ? date.format("DD-MM-YYYY") : ""
                          )
                        }
                        className="form-control"
                        disabled={isEditMode}
                        style={{ width: "150px !important" }}

                      />
                    </td>

                    {invoiceRows.some(
                      (row) => row.InvoiceStatus === "Generated"
                    ) && (
                        <td style={{ width: "200px !important" }}>
                          {row.InvoiceStatus === "Generated" ? (
                            <td>
                              {row.InvoiceFileID ? (
                                (() => {
                                  const file = invoiceDocuments.find(
                                    (doc: any) => doc.DocID === row.InvoiceFileID
                                  );
                                  return file ? (
                                    <button
                                      type="button"
                                      className="btn btn-link"
                                      // onClick={() =>
                                      //   window.open(file.EncodedAbsUrl, "_blank")
                                      // }
                                      onClick={(e) =>
                                        handleDownload(
                                          e,
                                          file.EncodedAbsUrl,
                                          { context }
                                        )
                                      }
                                    >
                                      {file.FileLeafRef}
                                    </button>
                                  ) : (
                                    <span>No file found</span>
                                  );
                                })()
                              ) : (
                                <span>No file found</span>
                              )}
                            </td>
                          ) : (
                            <td>Invoice Not Generated</td>
                          )}
                        </td>
                      )}

                    <td style={{ width: "200px !important" }}>
                      {isEditMode && row.showProceed && (
                        <>
                          {row.InvoiceStatus === "Started" &&
                            !proceededRows.includes(row.id) &&
                            row.employeeEmail === currentUserEmail &&
                            !pendingStatuses.includes(approverStatus) && (
                              <button
                                className="btn btn-primary me-2"
                                onClick={(e) => handleUpdateInvoiceRow(e, row)}
                              >
                                Proceed
                              </button>
                            )}
                          <button
                            className="btn btn-secondary me-2"
                            onClick={(e) => handleHistoryClick(e, row)}
                          >
                            <FontAwesomeIcon
                              icon={faClockRotateLeft}
                              title="Invoice History"
                            />
                          </button>
                        </>
                      )}
                     
                      {!isEditMode && (
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteInvoiceRow(row.id)}
                          disabled={
                            invoiceRows.length === 1 || disableDeleteInvoiceRow
                          }
                          title="Delete Invoice Row"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div> */}

        <style>{`
          .table-scroll-wrapper {
            overflow-x: auto;
            width: 100%;
          }
          .fixed-column, .fixed-th {
            min-width: 180px;
            max-width: 220px;
            width: 200px;
            white-space: nowrap;
          }
          .fixed-serial {
            min-width: 80px;
            max-width: 100px;
            width: 90px;
            white-space: nowrap;
          }
        `}</style>
        <div className="table-scroll-wrapper">
          <table
            className="table table-bordered align-middle"
            style={{ minWidth: "1200px" }}
          >
            <thead className="table-light">
              <tr>
                <th className="fixed-th fixed-serial">S.No</th>
                {/* <th className="fixed-th "><input
                  type="checkbox"
                  style={{ marginLeft: 8 }}
                  checked={allSelected}
                  onChange={handleSelectAll}
                /></th> */}

                <th className="fixed-th">Invoice Description</th>
                <th className="fixed-th">Remaining PO Amount</th>
                <th className="fixed-th">
                  Invoice Amount <span style={{ color: "red" }}>*</span>
                </th>
                <th className="fixed-th">
                  Invoice Due Date <span style={{ color: "red" }}>*</span>
                </th>
                {invoiceRows.some((row) => row.showProceed) && (
                  <th className="fixed-th">Invoice Proceed Date</th>
                )}
                {invoiceRows.some(
                  (row) => row.InvoiceStatus === "Generated"
                ) && <th className="">Invoice Attachment</th>}
                <th className="fixed-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows
                .filter((row) => {
                  if (userGroups.includes("CMSAccountGroup")) {
                    return row.InvoiceStatus !== "Started";
                  }
                  return true;
                })
                .slice()
                .sort((a, b) => Number(a.ClaimNo) - Number(b.ClaimNo))
                // .map((row, index) => (
                .map((row, index) => (
                  <tr key={row.id}>
                    <td className="fixed-column fixed-serial">{index + 1}</td>
                    {/* <td className="fixed-column "> <input
            type="checkbox"
            style={{ marginLeft: 8 }}
            checked={selectedRows.includes(row.id)}
            onChange={handleSelectRow(row.id)}
          /></td> */}
                    <td className="fixed-column">
                      <textarea
                        className={`form-control ${
                          errors[`InvoiceDescription_${index}`]
                            ? "is-invalid"
                            : ""
                        }`}
                        value={row.InvoiceDescription}
                        onChange={(e) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceDescription",
                            e.target.value
                          )
                        }
                        disabled={isEditMode}
                      />
                      {errors[`InvoiceDescription_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDescription_${index}`]}
                        </div>
                      )}
                    </td>
                    <td className="fixed-column">
                      <input
                        type="text"
                        className="form-control"
                        value={
                          index === 0
                            ? totalPoAmount.toFixed(2)
                            : row.RemainingPoAmount
                        }
                        disabled
                      />
                    </td>
                    <td className="fixed-column">
                      <input
                        type="number"
                        className={`form-control ${
                          errors[`InvoiceAmount_${index}`] ? "is-invalid" : ""
                        }`}
                        value={row.InvoiceAmount}
                        min={0}
                        step="any"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (Number(value) < 0) return;
                          handleTextFieldChange(index, "InvoiceAmount", value);
                        }}
                        disabled={isEditMode}
                      />
                      {errors[`InvoiceAmount_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceAmount_${index}`]}
                        </div>
                      )}
                    </td>
                    <td className="fixed-column">
                      <DatePicker
                        type="date"
                        className={`form-control ${
                          errors[`InvoiceDueDate_${index}`] ? "is-invalid" : ""
                        }`}
                        format="DD-MM-YYYY"
                        value={
                          row.InvoiceDueDate
                            ? moment(row.InvoiceDueDate, "DD-MM-YYYY")
                            : null
                        }
                        onChange={(date) =>
                          handleTextFieldChange(
                            index,
                            "InvoiceDueDate",
                            date ? date.format("DD-MM-YYYY") : ""
                          )
                        }
                        disabledDate={(current) =>
                          current && current < moment().startOf("day")
                        }
                        disabled={isEditMode}
                      />
                      {errors[`InvoiceDueDate_${index}`] && (
                        <div className="invalid-feedback">
                          {errors[`InvoiceDueDate_${index}`]}
                        </div>
                      )}
                    </td>
                    {row.showProceed && (
                      <td className="fixed-column">
                        <DatePicker
                          type="date"
                          format="DD-MM-YYYY"
                          value={
                            !row.InvoiceProceedDate ||
                            row.InvoiceProceedDate === "01/01/1970"
                              ? moment()
                              : moment(row.InvoiceProceedDate, "DD-MM-YYYY")
                          }
                          onChange={(date) =>
                            handleTextFieldChange(
                              index,
                              "InvoiceProceedDate",
                              date ? date.format("DD-MM-YYYY") : ""
                            )
                          }
                          className="form-control"
                          disabled={isEditMode}
                        />
                      </td>
                    )}
                    {invoiceRows.some(
                      (r) => r.InvoiceStatus === "Generated"
                    ) && (
                      <td className="">
                        {row.InvoiceStatus === "Generated" ? (
                          row.InvoiceFileID ? (
                            (() => {
                              const file = invoiceDocuments.find(
                                (doc) => doc.DocID === row.InvoiceFileID
                              );
                              return file ? (
                                <button
                                  type="button"
                                  className="btn btn-link"
                                  onClick={(e) =>
                                    handleDownload(e, file.EncodedAbsUrl, {
                                      context,
                                    })
                                  }
                                >
                                  {file.FileLeafRef}
                                </button>
                              ) : (
                                <span>No file found</span>
                              );
                            })()
                          ) : (
                            <span>No file found</span>
                          )
                        ) : (
                          <span>Invoice Not Generated</span>
                        )}
                      </td>
                    )}
                    <td className="fixed-column">
                      {isEditMode && row.showProceed && (
                        <>
                          {row.InvoiceStatus === "Started" &&
                            !proceededRows.includes(row.id) &&
                            row.employeeEmail === currentUserEmail &&
                            !pendingStatuses.includes(approverStatus) && (
                              <button
                                className="btn btn-primary me-2"
                                onClick={(e) => handleUpdateInvoiceRow(e, row)}
                              >
                                Proceed
                              </button>
                            )}
                          <button
                            className="btn btn-secondary me-2"
                            onClick={(e) => handleHistoryClick(e, row)}
                          >
                            <FontAwesomeIcon
                              icon={faClockRotateLeft}
                              title="Invoice History"
                            />
                          </button>
                        </>
                      )}
                      {isEditMode &&
                        row.employeeEmail === currentUserEmail &&
                        row.InvoiceStatus === "Proceed Approval" && (
                          <button className="btn btn-success" type="button">
                            Proceed approval pending
                          </button>
                        )}
                      {!isEditMode && (
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteInvoiceRow(row.id)}
                          disabled={invoiceRows.length === 1}
                          // disabled={invoiceRows.length === 1 || disableDeleteInvoiceRow}
                          title="Delete Invoice Row"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* </div> */}

      {/* Modal for Edit */}
      <Modal
        show={showEditModal}
        onHide={handleCloseModal}
        centered
        dialogClassName="custom-modal-width" // Add custom class for width
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <FinaceInvoiceSection
              invoiceRow={selectedRow}
              siteUrl={props.siteUrl}
              context={context}
              currentUserEmail={currentUserEmail}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {errors.invoiceTotal && (
        <div className="text-danger fw-bold mt-2">{errors.invoiceTotal}</div>
      )}

      {/* Modal for Invoice History */}
      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Invoice Payment History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="text-center">Loading...</div>
          ) : invoiceHistoryData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>S.no</th>
                    <th>Invoice Tax Amount</th>
                    <th>Payment Date</th>
                    <th>Payment Amount</th>
                    <th>Pending Amount</th>
                    <th>Remarks</th>
                    <th>Financer Name</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceHistoryData.map((item, index) => (
                    <tr key={item.Id}>
                      <td>{index + 1}</td>
                      <td>{item.InvoiceTaxAmount}</td>
                      <td>
                        {item.PaymentDate
                          ? moment(item.PaymentDate).format("DD-MM-YYYY")
                          : ""}
                      </td>
                      <td>{item.PaymentAmount}</td>
                      <td>{item.PendingAmount}</td>
                      <td>{item.Comment}</td>
                      <td>{item.FinancerName || ""}</td>
                      {/* Adjust according to your SharePoint column names */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-danger fw-bold">
              No payment received on this invoice.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
