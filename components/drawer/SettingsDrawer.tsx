import { Drawer } from '@mui/material';
import classNames from 'classnames';
import { IOSSwitch } from 'components/common/CustomSwitch';
import { MenuItem } from 'components/common/MenuItem';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { setDarkMode, setCustomRpc } from 'redux/reducers/AppSlice';
import { RootState } from 'redux/store';
import { openLink } from 'utils/commonUtils';
import { getContactList, getExternalLinkList } from 'utils/configUtils';
import { validateCustomRpc } from 'config/env';
import snackbarUtil from 'utils/snackbarUtils';
import { getCurrentRpc, updateCachedCustomRpc } from 'utils/web3Utils';
import { useState, useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const SettingsDrawer = (props: Props) => {
  const { open, onChangeOpen } = props;
  const dispatch = useAppDispatch();
  // Use separate selectors to avoid creating new objects
  const darkMode = useAppSelector((state: RootState) => state.app.darkMode);
  const customRpc = useAppSelector((state: RootState) => state.app.customRpc);

  const [customRpcInput, setCustomRpcInput] = useState('');
  const [currentActiveRpc, setCurrentActiveRpc] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Guards against an in-flight validation applying after the user cleared the
  // field or started another apply.
  const applyRequestId = useRef(0);

  useEffect(() => {
    // Update current active RPC when drawer opens or custom RPC changes
    if (open) {
      setCurrentActiveRpc(getCurrentRpc());
      setCustomRpcInput(customRpc || '');
      setValidationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customRpc]);

  const getContactIcon = (type: string) => {
    if (darkMode) {
      return `${type.toLowerCase()}-dark`;
    }
    return type.toLowerCase();
  };

  const refreshActiveRpc = () => {
    setCurrentActiveRpc(getCurrentRpc());
  };

  const handleClearCustomRpc = () => {
    // Invalidate any in-flight validation/apply
    applyRequestId.current += 1;
    setCustomRpcInput('');
    setValidationError(null);
    dispatch(setCustomRpc(null));
    // Also clears any stale failover state so the configured RPC is used again
    updateCachedCustomRpc(null);
    refreshActiveRpc();
  };

  const handleApplyCustomRpc = async () => {
    const trimmedRpc = customRpcInput.trim();

    if (!trimmedRpc) {
      handleClearCustomRpc();
      return;
    }

    if (trimmedRpc === customRpc) {
      setValidationError(null);
      refreshActiveRpc();
      return;
    }

    const requestId = ++applyRequestId.current;
    setIsValidating(true);
    setValidationError(null);

    try {
      // Test connectivity before persisting so a typo/unreachable endpoint
      // cannot become the app RPC.
      const isValid = await validateCustomRpc(trimmedRpc);

      // Superseded by a clear or another apply while the check was running
      if (requestId !== applyRequestId.current) {
        return;
      }

      if (!isValid) {
        setValidationError('Unable to connect to this RPC endpoint');
        snackbarUtil.error('RPC did not respond. Keeping the current setting.');
        refreshActiveRpc();
        return;
      }

      dispatch(setCustomRpc(trimmedRpc));
      // Makes the selected endpoint active immediately (clears stale state)
      updateCachedCustomRpc(trimmedRpc);
      refreshActiveRpc();
      snackbarUtil.success('Custom RPC applied');
    } catch (error) {
      if (requestId !== applyRequestId.current) {
        return;
      }
      console.error('RPC validation error:', error);
      setValidationError('RPC validation failed');
      snackbarUtil.error('RPC validation failed. Keeping the current setting.');
    } finally {
      if (requestId === applyRequestId.current) {
        setIsValidating(false);
      }
    }
  };

  const handleClearInputField = () => {
    setCustomRpcInput('');
    setValidationError(null);
  };

  const isUsingCustomRpc = !!customRpc && currentActiveRpc === customRpc;
  const isCustomRpcConfigured = !!customRpc;

  return (
    <Drawer
      anchor={'right'}
      open={open}
      onClose={() => onChangeOpen(false)}
      sx={{
        '& .MuiPaper-root': {
          background: darkMode ? '#1a1a1a' : '#f3f3ec',
          width: '400px',
          paddingTop: '1rem',
        },
      }}
    >
      <div className='pb-[1rem] flex-1 flex flex-col justify-between items-stretch'>
        <div>
          <div className='px-[.36rem]'>
            <div className='ml-[.24rem] mt-[.56rem] flex items-center'>
              <div className='text-[.16rem] mr-[.16rem]' style={{ color: darkMode ? "#fff" : "#1b1b1f" }}>
                Dark Mode
              </div>

              <IOSSwitch
                checked={darkMode}
                onChange={(e) => {
                  dispatch(setDarkMode(e.target.checked));
                }}
              />
            </div>

            <div className='mt-[.32rem] h-[0.01rem] bg-color-divider2' />

            {/* RPC Settings Section */}
            <div className='ml-[.24rem] mt-[.36rem]'>
              <div className='text-[.18rem] font-semibold mb-[.24rem]' style={{ color: darkMode ? "#fff" : "#1b1b1f" }}>
                RPC Settings
              </div>

              {/* Currently Using */}
              <div 
                className='p-[.16rem] rounded-[.08rem] mb-[.16rem]'
                style={{ 
                  background: darkMode ? '#2a2a2a' : '#e8e8e1',
                  border: `1px solid ${darkMode ? '#3a3a3a' : '#d8d8d1'}`
                }}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='text-[.12rem] mb-[.08rem]' style={{ color: darkMode ? "#999" : "#666" }}>
                      Currently Using:
                    </div>
                    <div 
                      className='text-[.14rem] break-all'
                      style={{ color: darkMode ? "#4ade80" : "#16a34a" }}
                    >
                      {currentActiveRpc}
                    </div>
                    {isUsingCustomRpc && (
                      <div 
                        className='text-[.11rem] mt-[.04rem]'
                        style={{ color: darkMode ? "#fbbf24" : "#d97706", fontStyle: 'italic' }}
                      >
                        (Custom RPC)
                      </div>
                    )}
                    {isCustomRpcConfigured && !isUsingCustomRpc && (
                      <div 
                        className='text-[.11rem] mt-[.04rem]'
                        style={{ color: darkMode ? "#f87171" : "#b91c1c", fontStyle: 'italic' }}
                      >
                        (Saved custom RPC is not in use — using fallback)
                      </div>
                    )}
                  </div>
                  {isCustomRpcConfigured && (
                    <button
                      onClick={handleClearCustomRpc}
                      className='ml-[.12rem] flex-shrink-0 w-[.24rem] h-[.24rem] flex items-center justify-center rounded-[.04rem] cursor-pointer transition-colors'
                      style={{
                        background: darkMode ? '#ef4444' : '#dc2626',
                        border: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? '#dc2626' : '#b91c1c';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? '#ef4444' : '#dc2626';
                      }}
                    >
                      <span style={{ color: '#fff', fontSize: '.16rem', fontWeight: 'bold' }}>×</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Custom RPC Input */}
              <div className='mb-[.12rem]'>
                <div className='text-[.13rem] mb-[.08rem]' style={{ color: darkMode ? "#ccc" : "#444" }}>
                  Custom RPC (optional):
                </div>
                <div className='relative'>
                  <input
                    type='text'
                    value={customRpcInput}
                    disabled={isValidating}
                    onChange={(e) => {
                      setCustomRpcInput(e.target.value);
                      setValidationError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isValidating) {
                          handleApplyCustomRpc();
                        }
                      }
                    }}
                    onBlur={() => {
                      if (!isValidating) {
                        handleApplyCustomRpc();
                      }
                    }}
                    placeholder='https://rpc.pulsechain.com'
                    className='w-full px-[.12rem] py-[.10rem] pr-[.36rem] rounded-[.06rem] text-[.14rem] outline-none transition-colors'
                    style={{
                      background: darkMode ? '#2a2a2a' : '#fff',
                      border: `1px solid ${
                        validationError
                          ? darkMode ? '#ef4444' : '#dc2626'
                          : darkMode ? '#3a3a3a' : '#ccc'
                      }`,
                      color: darkMode ? '#fff' : '#000',
                      opacity: isValidating ? 0.7 : 1,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = darkMode ? '#4ade80' : '#16a34a';
                    }}
                    onBlurCapture={(e) => {
                      const inputEl = e.currentTarget;
                      setTimeout(() => {
                        // Drop the focus override so the style based on
                        // validationError (red) is visible again
                        inputEl.style.borderColor = '';
                      }, 200);
                    }}
                  />
                  {customRpcInput && !isValidating && (
                    <button
                      onClick={handleClearInputField}
                      className='absolute right-[.08rem] top-1/2 -translate-y-1/2 w-[.20rem] h-[.20rem] flex items-center justify-center rounded-[.04rem] cursor-pointer transition-colors'
                      style={{
                        background: darkMode ? '#444' : '#ddd',
                        border: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? '#555' : '#ccc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? '#444' : '#ddd';
                      }}
                    >
                      <span style={{ color: darkMode ? '#fff' : '#666', fontSize: '.14rem', fontWeight: 'bold' }}>×</span>
                    </button>
                  )}
                </div>
                <div 
                  className='text-[.10rem] mt-[.08rem] italic'
                  style={{ color: darkMode ? "#888" : "#666" }}
                >
                  Press Enter or click outside to test and apply. The RPC is checked before it is used. Click × to clear and fall back to the configured RPC.
                </div>
                {isValidating && (
                  <div 
                    className='text-[.10rem] mt-[.08rem] font-semibold'
                    style={{ color: darkMode ? "#4ade80" : "#16a34a" }}
                  >
                    Testing RPC connection...
                  </div>
                )}
                {validationError && !isValidating && (
                  <div 
                    className='text-[.10rem] mt-[.08rem]'
                    style={{ color: darkMode ? "#f87171" : "#dc2626" }}
                  >
                    {validationError}
                  </div>
                )}
              </div>
            </div>

            <div className='mt-[.32rem] h-[0.01rem] bg-color-divider2' />

            <div className='ml-[.24rem]'>
              {getExternalLinkList().map(
                (item: { name: string; link: string }) => (
                  <MenuItem
                    key={item.name}
                    mt='.36rem'
                    text={item.name}
                    link={item.link}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div className='pl-[.56rem] flex items-center mt-2'>
          {getContactList().map(
            (item: { type: string; link: string }, index: number) => (
              <div
                key={item.type}
                className={classNames(
                  'cursor-pointer',
                  index > 0 ? 'ml-[.4rem]' : ''
                )}
                onClick={() => {
                  openLink(item.link);
                }}
              >
                <Icomoon icon={getContactIcon(item.type)} size='.48rem' />
              </div>
            )
          )}
        </div>
      </div>
    </Drawer>
  );
};
