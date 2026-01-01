/**
 * 应用配置文件
 * 开发者可以在此文件中自定义web resource名称和其他配置
 */

export interface AppConfig {
  /**
   * Web Resource 
   */
  webResource: {

    // currentName: string


    entityMetadataPage: string
  }
}


export const config: AppConfig = {
  webResource: {
    // currentName: '',

    entityMetadataPage: 'xxx_Entity_Metadata'
  }
}
