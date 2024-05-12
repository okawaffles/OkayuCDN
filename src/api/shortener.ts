import { ShortenedLink, ShortenedLinksList } from '../types';

// don't store these as they are meant to just be temporary
// for those who want to host content constantly, they should instead use static links
const shortened_links: ShortenedLinksList = {};

/**
 * Generate a shortened link and store it
 * @param user The user who has uploaded the content
 * @param content The name of the content
 * @param view_page Whether or not it should be the view page or just content
 * @returns the ID generated for sharing
 */
export function CreateLink(user: string, content: string, view_page: boolean): string {
    const link: ShortenedLink = {
        user,
        content,
        isViewPage: view_page
    };

    const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    let id = '';
    let i = 0;
    while (i < 6) {
        id = id + characters.charAt(Math.floor(Math.random() * characters.length));
        i++;
    }

    shortened_links[id] = link;
    return id;
} 

/**
 * Get the data from a shortened link ID
 * @param id The ID supplied in the UR:
 * @returns the ShortenedLink object stored
 */
export function GetLinkData(id: string): ShortenedLink { return shortened_links[id]; }