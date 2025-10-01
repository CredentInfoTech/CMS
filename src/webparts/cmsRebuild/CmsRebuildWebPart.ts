import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'CmsRebuildWebPartStrings';
import CmsRebuild from './components/CmsRebuild';
import { ICmsRebuildProps } from './components/ICmsRebuildProps';
export interface ICmsRebuildWebPartProps {
  description: string;
}

export default class CmsRebuildWebPart extends BaseClientSideWebPart<ICmsRebuildWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ICmsRebuildProps> = React.createElement(
      CmsRebuild,
      {
        description: this.properties.description,
        context: this.context,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        userGroups: [], // Pass default or fetched userGroups
        cmsDetails: [], // Pass default or fetched cmsDetails
        refreshCmsDetails: () => {}, // Pass the method to refresh CMS details
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
