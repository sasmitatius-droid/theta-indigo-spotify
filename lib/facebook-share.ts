export interface FacebookSharePayload {
  title: string;
  excerpt: string;
  bannerUrl: string; // Dynamic banner image URL or actual R2 URL
  articleId: string;
}

export async function shareToFacebookPage(payload: FacebookSharePayload): Promise<{ success: boolean; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID || '1176323298906078';
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || 'EAAco1TuLPu0BSPtIIF5vW5A3tp3BVMN69DIeV0DtOnoevYu7EaEAEIEVaZB0AGVGuMlZBHpiwnS6XRnp3IEhKZA9smQAofW1za3a0tQXJCh8fFVC2SZBnnKYK5TZCZBEcFcEaZAvP7z6wl8VyUGAzfijP62gdNUcagFc9EWN359HAIoXn0xKsAVQMauYiYGYMZC7hPzU4piY';

  if (!pageId || !accessToken) {
    console.warn('⚠️ Facebook configuration keys are missing.');
    return { success: false, error: 'Facebook configuration keys are missing.' };
  }

  // Construct message
  const message = `${payload.title}\n\n${payload.excerpt}\n\nBaca artikel selengkapnya di: https://www.indigoblueprint.my.id/blog/${payload.articleId}`;

  // Try to post as a photo with caption first
  const photoUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
  try {
    const res = await fetch(photoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: payload.bannerUrl,
        caption: message,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (res.ok && (data.id || data.post_id)) {
      return { success: true };
    }

    console.warn('Facebook photo share failed, falling back to link post. Error:', data);
    
    // Fallback: post to feed with link
    const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const fallbackRes = await fetch(feedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `${payload.title}\n\n${payload.excerpt}`,
        link: `https://www.indigoblueprint.my.id/blog/${payload.articleId}`,
        access_token: accessToken,
      }),
    });

    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.id) {
      return { success: true };
    }

    return {
      success: false,
      error: fallbackData.error?.message || JSON.stringify(fallbackData),
    };
  } catch (error: any) {
    console.error('Error sharing to Facebook:', error);
    return { success: false, error: error.message || 'Unknown network error' };
  }
}
