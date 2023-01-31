import { ClientUser } from 'types/user';
import { useQueryClient } from '@tanstack/react-query';
import Debug from 'debug';

/**
 * この関数が呼ばれるタイミングは、getAvatarImageUrlの返り値のパスをAvatar
 * コンポーネントのsrcに設定した結果、何らかのエラーが発生した状態
 * そのような状態で、かつ、キャッシュされているユーザーのavatarPathがnullでない場合は
 * そのパスが不正な場合 (例えば、バックエンドに保存されているファイルが削除された場合)なので
 * キャッシュのavatarPathをundefinedに上書きする
 */
export const removeCachedAvatarPath = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const cachedUserData = queryClient.getQueryData<ClientUser>(['user']);
  if (cachedUserData && cachedUserData.avatarPath) {
    debug(`removeCachedAvatarPath: ${cachedUserData.avatarPath}`);
    cachedUserData.avatarPath = undefined;
    queryClient.setQueryData(['user'], cachedUserData);
  }
};
