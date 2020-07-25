import * as signalR from '@microsoft/signalr'

class VideoClient {

    private connection: signalR.HubConnection
    private log: boolean

    constructor(hubUrl: string, log: boolean = false) {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl)
            .build()        
        this.log = log
        this.connection.on("ReceiveMessage", this.onReceiveMessage)

    }

    private onReceiveMessage(message: String) {
        if(this.log)
            console.log(`[VideoClientMsg] ${message}`)
    } 

    public fetchAvUrls(url: string): Promise<AvUrls> {
        return new Promise((resolve, reject) => {
            const receiveAvUrls = (audioUrl: string, videoUrl: string) => {
                resolve({audioUrl, videoUrl})
                this.connection.off("AvUrls")
            }
            this.connection.on("AvUrls", receiveAvUrls)

            this.connection.invoke("RequestAvUrls", url)
                .catch(reject)
        })
    }

    public trimVideo(url: string, start: string, duration: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const receiveDownloadLink = (downloadUrl: string) => {
                resolve(downloadUrl)
                this.connection.off("DownloadLink")
            }
            this.connection.on("DownloadLink", receiveDownloadLink)
            this.connection.invoke("RequestTrimVideo", url, start, duration)
                .catch(reject)
        })
    }

}

export type AvUrls = {
    audioUrl: string
    videoUrl: string
}