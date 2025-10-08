/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/explicit-function-return-type */

import { sp } from "@pnp/sp/presets/all";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";

/**
 * Checks if the current user is a member of the specified SharePoint group.
 * @param groupName - The name of the SharePoint group to check.
 * @returns A promise that resolves to `true` if the user is in the group, otherwise `false`.
 */

sp.setup({
  sp: {
    // --- Devsite ---- // 
  baseUrl: "https://credentinfotec.sharepoint.com/sites/IntranetPortal-Dev",

    // --- Production site ---- ///
    //  baseUrl: "https://credentinfotec.sharepoint.com/sites/Intranet-Portal",
  },
});

export const isUserInGroup = async (groupName: string): Promise<boolean> => {
  try {
    await sp.web.currentUser.groups.getByName(groupName)(); // Attempt to retrieve the group
    return true; // If no error, the group exists
  } catch (error) {
    console.error(
      `Group "${groupName}" does not exist or user is not a member.`,
      error
    );
    return false;
  }
};

/**
 * Fetches SharePoint list data with support for pagination.
 * @param props - The SPFx context.
 * @param List - The name of the SharePoint list.
 * @param filterQuery - The OData query string.
 * @returns A promise that resolves to an array of all items from the list.
 */
export const getSharePointData = async (
  props: { context: any },
  List: string,
  filterQuery: string
): Promise<any[]> => {
 
  const Url = `${props.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${List}')/items?${filterQuery}`;

  const fetchAllItems = async (
    url: string,
    accumulatedItems: any[] = []
  ): Promise<any[]> => {
    try {
      const response: SPHttpClientResponse =
        await props.context.spHttpClient.get(
          url,
          SPHttpClient.configurations.v1,
          {
            headers: {
              Accept: "application/json;odata=nometadata",
              "odata-version": "",
            },
          }
        );

      if (response.ok) {
        const data = await response.json();
        const items = data.value;
        const allItems = [...accumulatedItems, ...items];

        if (data["odata.nextLink"]) {
          console.log("Fetching next page:", data["odata.nextLink"]);
          return await fetchAllItems(data["odata.nextLink"], allItems); // Recursively fetch next pages
        }

        return allItems; // Return all accumulated items
      } else {
        console.error("Error fetching data:", response.statusText);
        return accumulatedItems; // Return accumulated items in case of an error
      }
    } catch (error) {
      console.error("Error:", error);
      return accumulatedItems; // Ensure a return value in case of an error
    }
  };

  return await fetchAllItems(Url); // Start fetching data
};

/**
 * Saves data to a specified SharePoint list.
 * @param listName - The name of the SharePoint list.
 * @param data - The data to save.
 * @param siteUrl - The site URL where the list is located.
 * @returns A promise that resolves to the response of the save operation.
 */

export const saveDataToSharePoint = async (
  listName: string,
  data: any,
  siteUrl: string
): Promise<any> => {
  const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;

  try {
    // Get Request Digest Token
    const authResponse = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
      },
    });

    if (!authResponse.ok) {
      throw new Error("Failed to fetch request digest token.");
    }

    const authData = await authResponse.json();
    const authCode = authData.d.GetContextWebInformation.FormDigestValue;

    // Add metadata for SharePoint
    const requestData = {
      __metadata: { type: `SP.Data.${listName}ListItem` },
      ...data,
    };

    // POST data to SharePoint list
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": authCode,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to save data to SharePoint list: ${response.statusText}`
      );
    }

    return await response.json(); // Return the response data
  } catch (error) {
    console.error("Error saving data to SharePoint:", error);
    throw error;
  }
};

/*Update Data in the sharepoint */
export const updateDataToSharePoint = async (
  listName: string,
  data: Record<string, any>,
  siteUrl: string,
  itemId: number
): Promise<any> => {
  const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`;

  try {
    // Step 1: Get Request Digest Token
    const authResponse = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
      },
    });

    if (!authResponse.ok) {
      throw new Error(`❌ Failed to fetch request digest token.`);
    }

    const authData = await authResponse.json();
    const authCode = authData.d.GetContextWebInformation.FormDigestValue;

    // Step 2: Create the request body with __metadata
    const requestData = {
      __metadata: {
        type: `SP.Data.${listName.replace(/\s/g, "_x0020_")}ListItem`,
      }, // Handle spaces in list name
      ...data,
    };

    // Step 3: Make the update (MERGE)
    const response = await fetch(apiUrl, {
      method: "MERGE",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": authCode,
        "IF-MATCH": "*", // Use "*" to allow any version to be overwritten
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(
        `❌ Failed to update item (ID: ${itemId}) in list '${listName}'. Status: ${response.status} - ${response.statusText}`
      );
    }

    console.log(`✅ Item ID ${itemId} updated successfully in '${listName}'`);
    return response; // Or return any specific detail if needed
  } catch (error) {
    console.error("Error updating data to SharePoint:", error);
    throw error;
  }
};

/* Upload file in the sharepoint libaray */

const fetchFiles = async (
  libarayName: string,
  filterQuery: string,
  selectedValues: string
): Promise<any[]> => {
  try {
    const files = await sp.web.lists
      .getByTitle(libarayName)
      .items.filter(`${filterQuery}`)
      .select(`${selectedValues}`)
      .get();
    return files;
  } catch (error) {
    console.error("Error fetching files:", error);
    alert("Error fetching files.");
    return [];
  }
};

export const addFileInSharepoint = async (
  file: File, // File object to upload
  updatedMetadata: any, // Metadata form data
  libarayName: string,
  filterQuery: string,
  selectedValues: string
): Promise<any[]> => {
  // Change return type to Promise<any[]>
  try {
    const randomNo = Math.floor(10000 + Math.random() * 90000);
    const input2 = file.name;
    const fields2 = input2.split(".");
    const namefile = fields2[0];
    const extension = fields2[1];
    const docRename = `${namefile}-${randomNo}.${extension}`;

    const folder = sp.web.getFolderByServerRelativeUrl(`${libarayName}`);
    let folderExists = true;
    try {
      await folder.get();
    } catch (error) {
      if (error.status === 404) {
        folderExists = false;
      } else {
        throw error;
      }
    }

    // Create the folder if it doesn't exist
    if (!folderExists) {
      await sp.web.folders.add(`${libarayName}`);
      console.log("Folder created successfully.");
    }

    const result = await folder.files.add(docRename, file, true);
    alert(`${file.name} uploaded successfully!`);

    // Update metadata
    const listItem = await result.file.getItem();
    await listItem.update(updatedMetadata);
    console.log("Metadata updated successfully!");
    // alert("Metadata updated successfully!");

    // Fetch and return the updated files
    const files = await fetchFiles(libarayName, filterQuery, selectedValues);
    return files; // Return the fetched files
  } catch (error) {
    console.error("Error in addFileInSharepoint:", error);
    alert("An error occurred while uploading the file or updating metadata.");
    return []; // Return an empty array in case of an error
  }
};

export const handleViewFile = (
  e: React.MouseEvent<HTMLButtonElement>,
  encodedUrl: string,
  props: { context: any }
): void => {
  try {
    e.preventDefault();
    const viewUrl = `${props.context.pageContext.web.absoluteUrl}/_layouts/15/Doc.aspx?sourcedoc=${encodedUrl}&file=${encodedUrl}&action=default`;
    window.open(viewUrl, "_blank");
  } catch (error) {
    console.error("Error in handleViewFile:", error);
    alert("An error occurred while opening the file.");
  }
};

export const handleDownload = async (
  e: React.MouseEvent<HTMLButtonElement>,
  encodedUrl: string,
  props: { context: any }
): Promise<void> => {
  try {
    e.preventDefault();
    const downloadUrl =
      props.context.pageContext.web.absoluteUrl +
      `/_layouts/download.aspx?SourceUrl=` +
      encodedUrl;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error in handleDownload:", error);
    alert("An error occurred while downloading the file.");
  }
};

/**
 * Fetches data from a SharePoint document library.
 * @param libraryName - The name of the document library.
 * @param filterQuery - The OData query string for filtering.
 * @param siteUrl - The site URL where the library is located.
 * @returns A promise that resolves to an array of items from the document library.
 */
export const getDocumentLibraryData = async (
  libraryName: string,
  filterQuery: string,
  siteUrl: string
): Promise<any[]> => {
  const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${libraryName}')/items?${filterQuery}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json;odata=nometadata",
        "odata-version": "",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from library: ${libraryName}, Status: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error(`Error fetching data from library "${libraryName}":`, error);
    throw error;
  }
};

export const deleteAttachmentFile = async (
  libraryName: string,
  itemId: number
) => {
  try {
    const response = await sp.web.lists
      .getByTitle(libraryName)
      .items.getById(itemId)
      .recycle(); // or .delete()
    return response;
  } catch (error) {
    console.error("Error deleting attachment:", error);
    throw error;
  }
};

// Cheack user in Group or not
/**
 * Fetches data from a SharePoint document library with a $select query.
 * @param libraryName - The name of the document library.
 * @param filterQuery - The OData query string for filtering.
 * @param selectFields - The fields to select in the query.
 * @param siteUrl - The site URL where the library is located.
 * @returns A promise that resolves to an array of items from the document library.
 */
export const getDocumentLibraryDataWithSelect = async (
  libraryName: string,
  filterQuery: string,
  selectFields: string,
  siteUrl: string
): Promise<any[]> => {
  const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${libraryName}')/items?${filterQuery}&$select=${selectFields}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json;odata=nometadata",
        "odata-version": "",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from library: ${libraryName}, Status: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error(`Error fetching data from library "${libraryName}":`, error);
    throw error;
  }
};

/**
 * Upload a file to a SharePoint document library with metadata.
 * @param spHttpClient The SPHttpClient instance from context.
 * @param siteUrl The absolute URL of the SharePoint site.
 * @param libraryName The name of the document library.
 * @param file The file object to upload.
 * @param metadata An object containing metadata key-value pairs.
 * @returns The uploaded file item response.
 */

// ...existing code...
export const uploadFileWithMetadata = async (
  file: File,
  updatedMetadata: any,
  libarayName: string
): Promise<any[]> => {
  try {
    const randomNo = Math.floor(10000 + Math.random() * 90000);
    const input2 = file.name;
    const fields2 = input2.split(".");
    const namefile = fields2[0];
    const extension = fields2[1];
    const docRename = `${namefile}-${randomNo}.${extension}`;

    // Always use the correct server-relative URL (no /_layouts/15/)
    // devsite ---/
   const folderServerRelativeUrl = `/sites/IntranetPortal-Dev/${libarayName}`;
    //-- Production site ---- ///
  //  const folderServerRelativeUrl = `/sites/Intranet-Portal/${libarayName}`;
    const folder = sp.web.getFolderByServerRelativePath(
      folderServerRelativeUrl
    );
    // const folder = sp.web.getFolderByServerRelativeUrl(folderServerRelativeUrl);

    let folderExists = true;  
    try {
      await folder.get();
    } catch (error) {
      if (error.status === 404) {
        folderExists = false;
      } else {
        throw error;
      }
    }

    if (!folderExists) {
      await sp.web.folders.add(folderServerRelativeUrl);
      console.log("Folder created successfully.");
    }

    const result = await folder.files.add(docRename, file, true);
    alert(`${file.name} uploaded successfully!`);

    // Log the file URL
    console.log("Uploaded file URL:", result.data.ServerRelativeUrl);

    // Update metadata
    const listItem = await result.file.getItem();
    await listItem.update(updatedMetadata);
    console.log("Metadata updated successfully!");
    // alert("Metadata updated successfully!");

    return [];
  } catch (error) {
    console.error("Error in uploadFileWithMetadata:", error);
    alert("An error occurred while uploading the file or updating metadata.");
    return [];
  }
};

// ...existing code...
// export const uploadFileWithMetadata = async (
//     file: File,
//     updatedMetadata: any,
//     libarayName: string,
// ): Promise<any[]> => {
//     try {
//         const randomNo = Math.floor(10000 + Math.random() * 90000);
//         const input2 = file.name;
//         const fields2 = input2.split('.');
//         const namefile = fields2[0];
//         const extension = fields2[1];
//         const docRename = `${namefile}-${randomNo}.${extension}`;

//         // const folder = sp.web.getFolderByServerRelativeUrl(`${libarayName}`);
//         const folder = sp.web.getFolderByServerRelativeUrl(`/sites/poc2/${libarayName}`);
//         let folderExists = true;
//         try {
//             await folder.get();
//         } catch (error) {
//             if (error.status === 404) {
//                 folderExists = false;
//             } else {
//                 throw error;
//             }
//         }

//         if (!folderExists) {
//             await sp.web.folders.add(`${libarayName}`);
//             console.log("Folder created successfully.");
//         }

//         const result = await folder.files.add(docRename, file, true);
//         alert(`${file.name} uploaded successfully!`);

//         // Log the file URL
//         console.log("Uploaded file URL:", result.data.ServerRelativeUrl);

//         // Update metadata
//         const listItem = await result.file.getItem();
//         await listItem.update(updatedMetadata);
//         console.log("Metadata updated successfully!");
//         alert("Metadata updated successfully!");

//         return [];
//     } catch (error) {
//         console.error("Error in addFileInSharepoint:", error);
//         alert("An error occurred while uploading the file or updating metadata.");
//         return [];
//     }
// };
