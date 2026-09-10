const fs = require('fs');
const path = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/src/pages/Admin.tsx';

let content = fs.readFileSync(path, 'utf8');

const regex = /const handleSendNotification = async \(e: React\.FormEvent\) => \{[\s\S]*?finally \{\s*setIsSubmitting\(false\);\s*\}\s*\};/;

const newFunc = `const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!previewTitle || !previewBody) {
      alert('Title and body are required.');
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl: string | undefined = undefined;

    try {
      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split('.').pop();
        const fileName = \`\${Math.random()}.\${fileExt}\`;
        const filePath = \`\${fileName}\`;

        const { error: uploadError } = await supabase.storage
          .from('notifications')
          .upload(filePath, selectedImageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('notifications')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      const isBroadcast = selectedUsers.length === 0;
      let tokens: string[] = [];
      let targetEmails: string[] = [];
      
      if (!isBroadcast) {
        const selectedProfiles = profiles.filter(p => selectedUsers.includes(p.id));
        tokens = selectedProfiles.map(p => p.push_token).filter(Boolean) as string[];
        targetEmails = selectedProfiles.map(p => p.email);
        
        if (tokens.length === 0) {
          throw new Error('None of the selected users have Push Enabled. Please select users with valid push tokens.');
        }
      }

      const payload = {
        title: previewTitle,
        body: previewBody,
        imageUrl: finalImageUrl,
        image: finalImageUrl, // Added for fallback support on frontend
        tokens: isBroadcast ? undefined : tokens
      };

      const { data, error } = await supabase.functions.invoke('send_push_notification', {
        body: payload
      });

      if (error) throw error;
      
      if (data?.failedTokens && data.failedTokens.length > 0) {
         for (const deadToken of data.failedTokens) {
           await supabase.from('profiles').update({ push_token: null }).eq('push_token', deadToken);
         }
      }

      await supabase.from('notifications_history').insert([{
        title: previewTitle,
        body: previewBody,
        image_url: finalImageUrl,
        target_users: isBroadcast ? ['All Users'] : targetEmails
      }]);

      alert(\`Push notification sent successfully!\`);
      
      setIsNotificationModalOpen(false);
      setSelectedUsers([]);
      setPreviewTitle('');
      setPreviewBody('');
      setPreviewImage(null);
      setSelectedImageFile(null);
      fetchData(); 
    } catch (err: any) {
      console.error(err);
      alert('Failed to send notification: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };`;

if (!regex.test(content)) {
    console.log("Could not find handleSendNotification!");
} else {
    content = content.replace(regex, newFunc);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Admin.tsx fixed successfully!");
}
