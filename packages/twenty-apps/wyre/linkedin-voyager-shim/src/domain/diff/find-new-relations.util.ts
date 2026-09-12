import { type UnipileRelation } from 'src/domain/unipile/unipile-relation.type';

export const findNewRelations = ({
  knownMemberIds,
  incoming,
}: {
  knownMemberIds: ReadonlySet<string>;
  incoming: UnipileRelation[];
}): UnipileRelation[] => incoming.filter((relation) => !knownMemberIds.has(relation.member_id));
