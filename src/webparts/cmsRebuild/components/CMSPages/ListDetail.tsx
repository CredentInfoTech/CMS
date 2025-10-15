/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define*/
/* eslint-disable  @typescript-eslint/no-floating-promises*/
/* eslint-disable  @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel, GridToolbar } from "@mui/x-data-grid";
import { Button, Stack, Typography, TextField } from "@mui/material";
import { Save, Add, ExitToApp, Delete } from "@mui/icons-material";
import {
    saveDataToSharePoint,
    updateDataToSharePoint,
} from "../services/SharePointService";
import { ICmsRebuildProps } from "../ICmsRebuildProps";

interface IListDetailProps {
    props: ICmsRebuildProps;
    listName: string;
    onExit: () => void;
}

export default function ListDetail({
    props,
    listName,
    onExit,
}: IListDetailProps) {
    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [loading, setLoading] = useState(false);
    const siteUrl = props.context.pageContext.web.absoluteUrl;

    // 🔹 Keep latest columns accessible in event handlers
    const columnsRef = useRef<GridColDef[]>([]);

    // For Rows Per Page
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 5, // default rows per page
    });

    /**
     * Fetch list schema and items from SharePoint dynamically.
     */
    const fetchListSchemaAndData = async () => {
        try {
            setLoading(true);

            // Fetch list fields
            const fieldsRes = await fetch(
                `${siteUrl}/_api/web/lists/getbytitle('${listName}')/fields?$filter=Hidden eq false and ReadOnlyField eq false`,
                { headers: { Accept: "application/json;odata=verbose" } }
            );
            const fieldsJson = await fieldsRes.json();
            const fieldData = fieldsJson.d.results;

            // Build DataGrid columns dynamically
            const dynamicColumns: GridColDef[] = fieldData
                .filter((field: any) =>
                    !field.Hidden &&
                    (field.InternalName === "Title" ||
                        (!field.FromBaseType &&
                            !["Attachments", "Editor", "Author", "ContentTypeId"].includes(field.InternalName)))
                )
                .map((field: any) => {
                    let renderCell: GridColDef["renderCell"];

                    // 🎯 Choice Field → Dropdown
                    if (field.TypeAsString === "Choice" && field.Choices?.results?.length > 0) {
                        renderCell = (params: GridRenderCellParams) => (
                            <TextField
                                select
                                variant="outlined"
                                size="small"
                                fullWidth
                                SelectProps={{ native: true }}
                                value={params.row[field.InternalName] || ""}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setRows((prev) =>
                                        prev.map((r) =>
                                            r.id === params.row.id ? { ...r, [field.InternalName]: newValue } : r
                                        )
                                    );
                                }}
                            >
                                <option value="">--Select--</option>
                                {field.Choices.results.map((choice: string) => (
                                    <option key={choice} value={choice}>
                                        {choice}
                                    </option>
                                ))}
                            </TextField>
                        );
                    }

                    // 🎯 Boolean Field → Checkbox
                    else if (field.TypeAsString === "Boolean") {
                        renderCell = (params: GridRenderCellParams) => (
                            <input
                                type="checkbox"
                                checked={!!params.row[field.InternalName]}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    setRows((prev) =>
                                        prev.map((r) =>
                                            r.id === params.row.id ? { ...r, [field.InternalName]: newValue } : r
                                        )
                                    );
                                }}
                            />
                        );
                    }

                    // 🎯 DateTime Field → Date Picker
                    else if (field.TypeAsString === "DateTime") {
                        renderCell = (params: GridRenderCellParams) => (
                            <TextField
                                type="date"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={
                                    params.row[field.InternalName]
                                        ? params.row[field.InternalName].split("T")[0]
                                        : ""
                                }
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setRows((prev) =>
                                        prev.map((r) =>
                                            r.id === params.row.id ? { ...r, [field.InternalName]: newValue } : r
                                        )
                                    );
                                }}
                            />
                        );
                    }

                    // 🎯 Number Field → Numeric Input
                    else if (field.TypeAsString === "Number") {
                        renderCell = (params: GridRenderCellParams) => (
                            <TextField
                                type="number"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={params.row[field.InternalName] || ""}
                                onChange={(e) => {
                                    const newValue = e.target.value === "" ? "" : Number(e.target.value);
                                    setRows((prev) =>
                                        prev.map((r) =>
                                            r.id === params.row.id ? { ...r, [field.InternalName]: newValue } : r
                                        )
                                    );
                                }}
                            />
                        );
                    }

                    // 🎯 Default → TextField
                    else {
                        renderCell = (params: GridRenderCellParams) => (
                            <TextField
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={params.row[params.field] || ""}
                                onChange={(e) => {
                                    const newValue = e.target.value; // take input as-is
                                    setRows((prev) =>
                                        prev.map((r) =>
                                            r.id === params.row.id ? { ...r, [params.field]: newValue } : r
                                        )
                                    );
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation(); // 🔹 Prevent DataGrid from handling SPACE (and other keys)
                                }}
                            />

                        );
                    }

                    return {
                        field: field.InternalName,
                        headerName: field.Title,
                        flex: 1,
                        minWidth: 150,
                        renderCell,
                    };
                });



            // Add Actions column
            dynamicColumns.push({
                field: "actions",
                headerName: "Actions",
                width: 180,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<Save />}
                            onClick={() => handleSave(params.id)}
                            disabled={loading} // <-- Only enable when rows are loaded
                        >
                            Save
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => handleDelete(params.id)}
                            disabled={loading}
                        >
                            Delete
                        </Button>
                    </Stack>
                ),
            });

            setColumns(dynamicColumns);
            columnsRef.current = dynamicColumns; // ✅ Keep ref synced

            // Fetch list items
            const itemsRes = await fetch(
                `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`,
                { headers: { Accept: "application/json;odata=verbose" } }
            );
            const itemsJson = await itemsRes.json();
            console.log("SharePoint items response:", itemsJson);

            const mappedRows = itemsJson.d.results.map((item: any) => ({
                id: item.Id,
                ...item,
            }));

            setRows(mappedRows);
            console.log("Rows loaded:", mappedRows);
        } catch (err) {
            console.error("Error fetching list schema/data:", err);
        } finally {
            setLoading(false);
        }
    };

    /** 🔹 Fetch on mount or list change */
    useEffect(() => {
        if (listName) fetchListSchemaAndData();
    }, [listName]);

    /**
     * Save or update SharePoint list item.
     */

    // 🔹 Keep a ref to latest rows to avoid stale closure issues
    const rowsRef = useRef<any[]>([]);
    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    const handleSave = async (rowId: string | number) => {
        const currentRows = rowsRef.current;

        if (!currentRows || currentRows.length === 0) {
            alert("Rows are not loaded yet. Please wait and try again.");
            return;
        }

        console.log("handleSave called with rowId:", rowId);
        console.log("Current rows:", currentRows.map((r) => r.id));

        try {
            setLoading(true);

            // Find the row in the latest state
            const actualRow = currentRows.find((r) => String(r.id) === String(rowId));
            if (!actualRow) {
                console.error("❌ No matching row found for id:", rowId);
                alert("Could not find updated data for this row!");
                return;
            }

            console.log("✅ Using latest state row:", actualRow);
            console.log("🧩 Columns:", columnsRef.current.map((c) => c.field));

            // Build payload for SharePoint
            // ✅ Build payload safely — skip empty optional fields
            const payload: Record<string, any> = {};

            columnsRef.current.forEach((col) => {
                if (col.field !== "actions" && col.field !== "id") {
                    const value = actualRow[col.field];

                    // Skip undefined, null, or empty-string values (SharePoint treats them as "clear value")
                    if (value === undefined || value === null || value === "") return;

                    // Normalize boolean values
                    if (typeof value === "boolean") {
                        payload[col.field] = value;
                    }
                    // Convert "true"/"false" strings to boolean
                    else if (value === "true" || value === "false") {
                        payload[col.field] = value === "true";
                    }
                    // Otherwise just assign as is
                    else {
                        payload[col.field] = value;
                    }
                }
            });

            // ✅ Ensure Title is never missing — SharePoint requires it
            if (!payload.Title || payload.Title === "") {
                payload.Title = actualRow.Title || "(Untitled)";
            }

            console.log("🧩 Cleaned payload before update:", payload);


            let newId = actualRow.id;

            // Save or update depending on row type
            if (String(actualRow.id).startsWith("new-")) {
                console.log("🔹 Adding new item:", payload);
                const response = await saveDataToSharePoint(listName, payload, siteUrl);
                if (response?.d?.Id) {
                    newId = response.d.Id; // Use SharePoint-assigned ID
                }
            } else {
                console.log("🔹 Updating existing item:", payload);
                await updateDataToSharePoint(listName, payload, siteUrl, Number(actualRow.id));
            }

            // Update local state with new/updated row
            setRows((prev) =>
                prev.map((r) =>
                    r.id === actualRow.id ? { ...r, ...payload, id: newId } : r
                )
            );

            alert("✅ Saved successfully!");
        } catch (error: any) {
            console.error("❌ Save failed:", error);
            alert("Failed to save. Check console for details.");
        } finally {
            setLoading(false);
        }
    };


    /** Add a new editable row */
    const handleAddRow = () => {
        const id = `new-${Date.now()}`;
        const newRow: any = { id };
        columnsRef.current.forEach((col) => {
            if (col.field !== "actions" && col.field !== "id") newRow[col.field] = "";
        });
        setRows((prev) => [newRow, ...prev]);
    };


    /** Delete a row (with confirmation and SharePoint sync) */
    const handleDelete = async (id: any) => {
        const currentRows = rowsRef.current;
        const rowToDelete = currentRows.find((r) => r.id === id);
        if (!rowToDelete) {
            alert("Row not found. Please refresh and try again.");
            return;
        }

        const confirmDelete = window.confirm(
            `⚠️ Are you sure you want to delete "${rowToDelete.Title || listName}"?`
        );

        if (!confirmDelete) return;

        try {
            setLoading(true);

            // 🧩 If it's a new unsaved row, just remove it locally
            if (String(id).startsWith("new-")) {
                setRows((prev) => prev.filter((r) => r.id !== id));
                alert("🗑️ Deleted locally (unsaved row).");
                return;
            }

            // 🧩 Get fresh FormDigestValue (required for DELETE operations)
            const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
                method: "POST",
                headers: { Accept: "application/json;odata=verbose" },
            });

            if (!digestRes.ok) {
                throw new Error("Failed to get X-RequestDigest token");
            }

            const digestJson = await digestRes.json();
            const digestValue = digestJson.d.GetContextWebInformation.FormDigestValue;

            // 🧩 Proceed with delete
            const deleteRes = await fetch(
                `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${id})`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json;odata=verbose",
                        "X-RequestDigest": digestValue,
                        "IF-MATCH": "*",
                        "X-HTTP-Method": "DELETE",
                    },
                }
            );

            if (!deleteRes.ok) {
                throw new Error(`Failed to delete item (status ${deleteRes.status})`);
            }

            // ✅ Remove the deleted row locally
            setRows((prev) => prev.filter((r) => r.id !== id));

            alert(`✅ Deleted successfully: "${rowToDelete.Title || "(No Title)"}".`);
        } catch (err) {
            console.error("❌ Delete failed:", err);
            alert("Failed to delete. Check console for details.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ padding: "24px" }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
            >
                <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#035DA2" }}
                >
                    {listName}
                </Typography>

                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<Add />}
                        variant="contained"
                        onClick={handleAddRow}
                        color="primary"
                    >
                        Add Row
                    </Button>
                    <Button
                        startIcon={<ExitToApp />}
                        variant="outlined"
                        color="secondary"
                        onClick={onExit}
                    >
                        Exit
                    </Button>
                </Stack>
            </Stack>

            <div style={{ height: 500, width: "100%", background: "#fff" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    disableRowSelectionOnClick
                    loading={loading}
                    pagination
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[5, 10, 15, 20]}
                    slots={{ toolbar: GridToolbar }}
                    sx={{ "& .MuiDataGrid-cell": { outline: "none" } }}
                />
            </div>
        </div>
    );
}
