'use client';

import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import getSymbolFromCurrency from 'currency-symbol-map';
import { parseISO, addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { Subscription } from '@/types';
import { convertCurrencySync } from '@/lib/currencyConverter';
import { getTagColor, pluralize } from '@/lib/utils';

const Container = styled.div`
  background: transparent;
  border-radius: 12px;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SortLabel = styled.label`
  @media (max-width: 768px) {
    display: none;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  padding-right: 2.25rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #2c2c2c;
  background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%2303DAC6' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.65rem center;
  background-size: 18px;
  color: #fff;
  font-size: 0.9rem;
  appearance: none;
  cursor: pointer;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListContainer = styled.div``;

const Item = styled(motion.li)`
  position: relative;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    border-radius: 6px;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    padding-right: 48px;
  }
`;

const ItemDetails = styled.div`
  margin-top: 5px;
  padding-top: 0;
  border-top: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.9em;
  color: #ccc;
  flex: 1;
  min-width: 200px;
`;

const ItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 10px;
  flex: 1;
  min-width: 150px;

  @media (max-width: 768px) {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    flex: none;
    min-width: 0;
    margin-top: 0;
  }
`;

const DesktopActions = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileActions = styled.div`
  position: relative;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenuButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--primary-color);
  font-size: 1.35rem;

  &:hover {
    opacity: 0.82;
  }
`;

const MobileMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 5;
  display: grid;
  gap: 2px;
  min-width: 120px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(32, 32, 32, 0.98);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
`;

const MobileMenuItem = styled.button<{ variant?: 'delete' }>`
  display: flex;
  align-items: center;
  min-height: 38px;
  width: 100%;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: ${props => props.variant === 'delete' ? '#ff6b7f' : '#fff'};
  font-size: 0.95rem;
  text-align: left;

  &:hover {
    background: ${props => props.variant === 'delete' ? 'rgba(233, 69, 96, 0.16)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

const Button = styled.button<{ variant?: 'delete' }>`
  padding: 5px 10px;
  border: 1px solid ${props => props.variant === 'delete' ? '#E94560' : 'transparent'};
  border-radius: 5px;
  cursor: pointer;
  background: ${props => props.variant === 'delete' ? 'transparent' : '#2c2c2c'};
  color: ${props => props.variant === 'delete' ? '#ff6b7f' : 'white'};
  margin-left: 5px;

  &:hover {
    background: ${props => props.variant === 'delete' ? 'rgba(233, 69, 96, 0.12)' : '#333'};
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 8px 14px;
    min-height: 44px;
    font-size: 0.95rem;
    margin-left: 0;
    text-align: left;
  }
`;

const Badge = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #fff;
`;

const AccountLine = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 5px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 4px 8px;
  }
`;

const MobileDetailTags = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
    margin-left: auto;
  }
`;

const DetailBadges = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 5px;

  @media (max-width: 768px) {
    width: 100%;
    gap: 4px 0;
  }
`;

const DetailBadge = styled(Badge)<{ $variant?: 'autopay' }>`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin: 2px 5px 2px 0;
  white-space: nowrap;
  height: 24px;
  background-color: ${props => props.$variant === 'autopay' ? 'rgba(69, 183, 209, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$variant === 'autopay' ? '#45B7D1' : '#fff'};
  order: ${props => props.$variant === 'autopay' ? '0' : '-1'};

  @media (max-width: 768px) {
    height: auto;
    padding: 0;
    border-radius: 0;
    background-color: transparent;
    font-size: 0.86em;
    margin: 1px 12px 1px 0;
  }
`;

const TagChip = styled(Badge)<{ $bg: string; $color: string }>`
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.7em;
  margin: 2px 4px 2px 0;
  white-space: nowrap;
  height: 18px;
  background-color: ${props => props.$bg};
  color: ${props => props.$color};

  @media (max-width: 768px) {
    margin: 0;
  }
`;

const DesktopTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
  width: 100%;

  @media (max-width: 768px) {
    display: none;
  }
`;

interface Props {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: number) => void;
  onToggleInclude: (id: number) => void;
  showCurrencySymbol: boolean;
  currency: string;
  onFilteredSubscriptionsChange?: (filteredSubscriptions: Subscription[]) => void;
  onTagFilterChange?: (tags: string[]) => void;
}

function getNextDueDate(subscription: Subscription): Date | null {
  // Try due_date if dueDate is not available
  const dueDateValue = subscription.dueDate || subscription.due_date;

  if (!dueDateValue) {
    return null;
  }

  const today = new Date();
  let dueDate = parseISO(dueDateValue);
  const intervalValue = subscription.intervalValue ?? 1;
  const intervalUnit = subscription.intervalUnit ?? 'months';

  while (dueDate <= today) {
    switch (intervalUnit) {
      case 'days':
        dueDate = addDays(dueDate, intervalValue);
        break;
      case 'weeks':
        dueDate = addWeeks(dueDate, intervalValue);
        break;
      case 'months':
        dueDate = addMonths(dueDate, intervalValue);
        break;
      case 'years':
        dueDate = addYears(dueDate, intervalValue);
        break;
      default:
        return dueDate;
    }
  }

  return dueDate;
}

export default function SubscriptionList({
  subscriptions,
  onEdit,
  onDelete,
  onToggleInclude,
  showCurrencySymbol,
  currency,
  onFilteredSubscriptionsChange,
  onTagFilterChange
}: Props) {
  const [sortBy, setSortBy] = useState<'dueDate' | 'creditCard' | 'amount' | 'tags'>('dueDate');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [openActionsId, setOpenActionsId] = useState<number | null>(null);

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const code = currencyCode || 'USD';

    if (showCurrencySymbol) {
      const symbol = getSymbolFromCurrency(code) || '$';
      return `${symbol}${amount.toFixed(2)}`;
    } else {
      return `${amount.toFixed(2)} ${code}`;
    }
  };

  // Get all unique tags from subscriptions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    subscriptions.forEach(sub => {
      if (sub.tags && sub.tags.length > 0) {
        sub.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [subscriptions]);

  // Toggle tag selection
  const handleTagClick = (tag: string) => {
    setTagFilters(prevTags => {
      if (prevTags.includes(tag)) {
        return prevTags.filter(t => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  };

  // Filter subscriptions by tags
  const filteredSubscriptions = useMemo(() =>
    tagFilters.length > 0
      ? subscriptions.filter(sub =>
        sub.tags && sub.tags.some(tag => tagFilters.includes(tag))
      )
      : subscriptions,
    [subscriptions, tagFilters]
  );

  // Keep summaries aligned with the current tag filter.
  useEffect(() => {
    if (onFilteredSubscriptionsChange) {
      onFilteredSubscriptionsChange(filteredSubscriptions);
    }
    if (onTagFilterChange) {
      onTagFilterChange(tagFilters);
    }
  }, [filteredSubscriptions, onFilteredSubscriptionsChange, tagFilters, onTagFilterChange]);

  useEffect(() => {
    if (openActionsId === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-subscription-actions]')) {
        return;
      }

      setOpenActionsId(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [openActionsId]);

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        const dateA = getNextDueDate(a);
        const dateB = getNextDueDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // null dates come last
        if (!dateB) return -1;
        // Use non-null assertion as we've checked both values are not null
        return dateA!.getTime() - dateB!.getTime();
      case 'creditCard':
        return (a.account || '').localeCompare(b.account || '');
      case 'amount':
        const aAmount = convertCurrencySync(
          typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount,
          a.currency || 'USD',
          currency
        ) ?? 0;
        const bAmount = convertCurrencySync(
          typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount,
          b.currency || 'USD',
          currency
        ) ?? 0;
        return bAmount - aAmount;
      case 'tags':
        const aTags = a.tags?.join('') || '';
        const bTags = b.tags?.join('') || '';
        return aTags.localeCompare(bTags);
      default:
        return 0;
    }
  });

  return (
    <Container>
      <Header>
        <Title>Subscriptions list</Title>
        <Controls>
          <SortLabel htmlFor="sort-select">Sort by: </SortLabel>
          <Select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="dueDate">Due date</option>
            <option value="creditCard">Credit card</option>
            <option value="amount">Amount</option>
            <option value="tags">Tags</option>
          </Select>
        </Controls>
      </Header>

      {allTags.length > 0 && (
        <TagsContainer>
          {tagFilters.length > 0 && (
            <Badge
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.8em',
                margin: '2px 8px 2px 0',
                cursor: 'pointer',
                backgroundColor: '#333',
                color: '#fff',
                transition: 'all 0.2s ease',
                boxShadow: 'none',
              }}
              onClick={() => setTagFilters([])}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.backgroundColor = '#444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#333';
              }}
            >
              <Icon icon="mdi:close" style={{ marginRight: '4px' }} />
              Clear all
            </Badge>
          )}
          {allTags.map((tag, index) => {
            const tagColor = getTagColor(tag);
            return (
              <Badge
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8em',
                  margin: '2px 4px 2px 0',
                  cursor: 'pointer',
                  backgroundColor: tagFilters.includes(tag) ? tagColor.text : tagColor.bg,
                  color: tagFilters.includes(tag) ? '#fff' : tagColor.text,
                  fontWeight: tagFilters.includes(tag) ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                  boxShadow: 'none',
                }}
                onClick={() => handleTagClick(tag)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  if (!tagFilters.includes(tag)) {
                    e.currentTarget.style.backgroundColor = tagColor.text;
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (!tagFilters.includes(tag)) {
                    e.currentTarget.style.backgroundColor = tagColor.bg;
                    e.currentTarget.style.color = tagColor.text;
                  }
                }}
              >
                {tag}
              </Badge>
            );
          })}
        </TagsContainer>
      )}
      <ListContainer>
        <List>
          <AnimatePresence>
            {sortedSubscriptions.map((sub) => (
              <Item
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ItemInfo>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={sub.included !== false}
                      aria-label={`${sub.included === false ? 'Include' : 'Exclude'} ${sub.name} in totals`}
                      onChange={() => onToggleInclude(sub.id!)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#03DAC6',
                      }}
                    />
                  </div>
                  <Icon
                    icon={`mdi:${sub.icon}`}
                    style={{ color: sub.color, fontSize: '1.5em' }}
                  />
                  <div>
                    <p style={{
                      fontSize: '1.2em',
                      margin: 0,
                      color: '#fff',
                      wordWrap: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px'
                    }}>{sub.name}</p>
                    <p style={{ fontSize: '0.8em', margin: 0, color: '#adadad' }}>
                      {formatCurrency(sub.amount, sub.currency)}/{pluralize(sub.intervalValue, sub.intervalUnit)}
                    </p>
                  </div>
                </ItemInfo>
                <ItemDetails>
                  <AccountLine>
                    <Icon icon="mdi:credit-card" style={{ marginRight: '5px', color: '#45B7D1' }} />
                    <span style={{ color: '#ccc' }}>{sub.account || 'Not Specified'}</span>
                  </AccountLine>
                  <DetailBadges>
                    <DetailBadge>
                      {(() => {
                        const nextDueDate = getNextDueDate(sub);
                        if (nextDueDate) {
                          return format(nextDueDate, 'MMM d, yyyy');
                        } else {
                          return 'No due date';
                        }
                      })()}
                    </DetailBadge>
                    {Boolean(sub.autopay) && (
                      <DetailBadge $variant="autopay">
                        <Icon icon="mdi:auto-pay" style={{ marginRight: '3px' }} />
                        Auto-pay
                      </DetailBadge>
                    )}
                    {sub.tags && sub.tags.length > 0 && (
                      <MobileDetailTags>
                        {sub.tags.map((tag, index) => {
                          const tagColor = getTagColor(tag);
                          return (
                            <TagChip key={index} $bg={tagColor.bg} $color={tagColor.text}>
                              {tag}
                            </TagChip>
                          );
                        })}
                      </MobileDetailTags>
                    )}
                  </DetailBadges>
                  {sub.tags && sub.tags.length > 0 && (
                    <DesktopTagList>
                      {sub.tags.map((tag, index) => {
                        const tagColor = getTagColor(tag);
                        return (
                          <TagChip
                            key={index}
                            $bg={tagColor.bg}
                            $color={tagColor.text}
                          >
                            {tag}
                          </TagChip>
                        );
                      })}
                    </DesktopTagList>
                  )}
                </ItemDetails>
                <ItemActions data-subscription-actions>
                  <DesktopActions>
                    <Button onClick={() => onEdit(sub)}>Edit</Button>
                    <Button variant="delete" onClick={() => onDelete(sub.id!)}>
                      Delete
                    </Button>
                  </DesktopActions>
                  <MobileActions>
                    <MobileMenuButton
                      type="button"
                      aria-label={`Open actions for ${sub.name}`}
                      aria-haspopup="menu"
                      aria-expanded={openActionsId === sub.id}
                      onClick={() => setOpenActionsId((current) => (current === sub.id ? null : sub.id!))}
                    >
                      <Icon icon="mdi:dots-vertical" />
                    </MobileMenuButton>
                    {openActionsId === sub.id && (
                      <MobileMenu role="menu">
                        <MobileMenuItem
                          role="menuitem"
                          onClick={() => {
                            setOpenActionsId(null);
                            onEdit(sub);
                          }}
                        >
                          Edit
                        </MobileMenuItem>
                        <MobileMenuItem
                          role="menuitem"
                          variant="delete"
                          onClick={() => {
                            setOpenActionsId(null);
                            onDelete(sub.id!);
                          }}
                        >
                          Delete
                        </MobileMenuItem>
                      </MobileMenu>
                    )}
                  </MobileActions>
                </ItemActions>
              </Item>
            ))}
          </AnimatePresence>
        </List>
      </ListContainer>
    </Container>
  );
} 
